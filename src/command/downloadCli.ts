import axios, { CancelTokenSource } from 'axios';
import * as child_process from 'child_process';
import * as fs from 'fs';
import { isObject } from 'lodash';
import * as stream from 'stream';
import * as vscode from 'vscode';
import { getArch, getPlatform } from '../common/functions';
import Loger from '../common/loger';
import { ResponseDataType } from '../common/types';
import Utils from '../common/utils';
import Service, { DownloadAxiosResponse } from '../service';
interface IDownloadCli {
  init(): Promise<void>;
}

export default class DownloadCli extends Utils implements IDownloadCli {
  protected vsProgress: Thenable<boolean> | undefined;

  async init(): Promise<void> {
    if (this.vsProgress) {
      vscode.window.showWarningMessage(`正在下载OpenSCA-cli，请耐心等待`);
      return;
    }
    await this.needUpdateEngine();
  }

  /**
   * 检查当前本地的cli版本是否是最新版本
   * @returns {any}
   */
  private async needUpdateEngine(): Promise<any> {
    const engineCliDirExists: boolean = fs.existsSync(this.engineCliDir);
    if (!engineCliDirExists) {
      fs.mkdirSync(this.engineCliDir, {
        recursive: true,
      });
    }

    let currVersion = '';
    const engineCliExists: boolean = fs.existsSync(this.customCliPath);
    if (!engineCliExists) {
      currVersion = '';
    } else {
      currVersion = await new Promise(resolve => {
        try {
          const args = ['-version'];
          const scanProcess = child_process.spawn(this.customCliPath, args);
          scanProcess.stdout?.on('data', function (data) {
            if (String(data).startsWith('v')) {
              resolve(String(data));
            } else {
              resolve('');
            }
          });
          scanProcess.on('error', () => {
            resolve('');
          });
        } catch (error) {
          resolve('');
        }
      });
    }

    if (!getPlatform() || !getArch()) {
      vscode.window.showErrorMessage('OpenSCA-cli 暂不支持当前系统');
      Loger.record('OpenSCA-cli 暂不支持当前系统', 'warning');
      return Promise.resolve({ status: false });
    }

    const lastVersionRes: ResponseDataType = await Service.lastVersion();
    if (!isObject(lastVersionRes) || lastVersionRes.code !== 0) {
      vscode.window.showErrorMessage('OpenSCA-cli 下载失败');
      Loger.record('OpenSCA-cli 下载失败', 'error');
      return Promise.resolve({ status: false });
    }

    const lastVersion: string = String(lastVersionRes.data) || '';
    if (lastVersion === currVersion) {
      vscode.window.showInformationMessage('当前OpenSCA-cli是最新版本，不需要更新', '继续更新').then(selection => {
        if (selection === '继续更新') {
          Loger.record('当前OpenSCA-cli是最新版本，不需要更新，点击了继续更新', 'info');
          this.downloadEngine();
        }
      });
      return Promise.resolve({ status: false });
    }
    return this.downloadEngine();
  }

  /**
   * 下载cli
   * @returns {Promise}
   */
  private async downloadEngine(): Promise<any> {
    return (this.vsProgress = vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: '正在下载OpenSCA-cli',
        cancellable: true,
      },
      async (progress, token) => {
        const [request, requestToken] = Service.downloadCli();
        token.onCancellationRequested(() => {
          Loger.warning('点击取消下载 OpenSCA-cli');
          requestToken.cancel();
        });
        progress.report({ increment: 0 });
        return await this.doDownload(requestToken, token, request, progress);
      }
    ));
  }

  /**
   * 执行下载
   * @param {CancelTokenSource} requestToken
   * @param {vscode.CancellationToken} token
   * @param {Promise<DownloadAxiosResponse>} request
   * @param {vscode.Progress<{message?:string;increment?:number}>} progress
   * @returns {Promise<boolean> }
   */
  private async doDownload(requestToken: CancelTokenSource, token: vscode.CancellationToken, request: Promise<DownloadAxiosResponse>, progress: vscode.Progress<{ message?: string; increment?: number }>): Promise<boolean> {
    token.onCancellationRequested(() => {
      this.vsProgress = undefined;
      Loger.warning('点击取消下载 OpenSCA-cli');
      requestToken.cancel();
    });

    progress.report({ increment: 0 });
    const writer = fs.createWriteStream(this.engineCliPath, {
      mode: 0o766,
    });

    let lastPercentCompleted = 0;
    try {
      const { data, headers }: { data: stream.Readable; headers: { [header: string]: unknown } } = await request;
      const contentLength = headers['content-length'] as number;
      let downloadedBytes = 0;

      data.on('data', (chunk: Buffer) => {
        downloadedBytes += chunk.length;
        const percentCompleted = Math.floor((downloadedBytes / contentLength) * 100);
        const increment = percentCompleted - lastPercentCompleted;
        lastPercentCompleted = percentCompleted;
        progress.report({ increment: increment });
      });

      data.pipe(writer);
      return new Promise((resolve, reject) => {
        data.on('end', () => {
          stream.finished(writer, err => {
            this.vsProgress = undefined;
            if (err) {
              reject(err);
            } else {
              vscode.workspace.getConfiguration('opensca').update('cliPath', this.engineCliPath, true);
              vscode.window.showInformationMessage('OpenSCA-cli 下载完成');
              Loger.record('OpenSCA-cli 下载完成');
              resolve(true);
            }
          });
        });
      });
    } catch (err) {
      if (axios.isCancel(err)) {
        return false;
      }
      throw err;
    }
  }
}
