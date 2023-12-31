import * as child_process from 'child_process';
import * as fs from 'fs';
import JSON5 from 'json5';
import path from 'path';
import * as vscode from 'vscode';
import { OPENSCA_CLEAR_SCANRESULT_COMMAND, OPENSCA_DOWNLOAD_CLI_COMMAND, OPENSCA_REFRESH_OPERATION_COMMAND, OPENSCA_REFRESH_SCANRESULT_COMMAND, OPENSCA_VIEW_COMMAND, WORKBENCH_ACTION_OPENSETTING } from '../common/commands';
import { getIdentity } from '../common/functions';
import Loger from '../common/loger';
import Utils from '../common/utils';
import Service from '../service';

interface IScan {
  scanProcessRuning: boolean;
  start(): void;
  run(token: vscode.CancellationToken): Promise<boolean>;
  stop(): void;
}

interface ConfType {
  path?: string;
  token?: string;
  out?: string;
  progress?: boolean;
  url?: string;
  log?: string;
  origin?: any;
  maven?: any[];
  optional: {
    vuln?: boolean;
    dedup?: boolean;
    dev?: boolean;
  };
}

export default class Scan extends Utils implements IScan {
  public scanProcessRuning = false;
  protected vsProgress: Thenable<boolean> | undefined;
  protected scanProcess!: child_process.ChildProcess;

  constructor() {
    super();
  }

  /**
   * 开始扫描
   * @returns {void}
   */
  start(): void {
    if (!this.scanProcessRuning) {
      Loger.info('OpenSCA-CLI 开始运行');
      Loger.info('OpenSCA-CLI 开始运行 outputPath：' + this.outputPathJson);
      const reportExists: boolean = fs.existsSync(this.outputPathJson);
      if (reportExists) {
        vscode.commands.executeCommand(OPENSCA_CLEAR_SCANRESULT_COMMAND);
      }
      setTimeout(() => {
        this.vsProgress = vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: 'OpenSCA-CLI 正在运行中...',
            cancellable: true,
          },
          async (_, token) => {
            token.onCancellationRequested(() => {
              this.stop();
            });
            return await this.run(token);
          }
        );
      }, 1000);
    } else {
      vscode.window.showInformationMessage('检测任务正在运行');
    }
  }

  /**
   * 运行
   * @returns {void}
   */
  async run(token: vscode.CancellationToken): Promise<boolean> {
    token.onCancellationRequested(() => {
      this.stop();
    });

    const generateDefaultConfigStatus = await this.generateDefaultConfig();
    let [writeConfigStatus, errMsg] = [true, ''];

    if (generateDefaultConfigStatus) {
      [writeConfigStatus, errMsg] = await this.writeConfig();
    }

    return new Promise((resolve, reject) => {
      const engineCliExists: boolean = fs.existsSync(this.customCliPath);
      if (!engineCliExists) {
        vscode.window.showWarningMessage('没有找到 OpenSCA-cli', '下载').then(selection => {
          if (selection === '下载') {
            vscode.commands.executeCommand(OPENSCA_DOWNLOAD_CLI_COMMAND);
          }
        });
        return reject(false);
      }

      const identityFileExists: boolean = fs.existsSync(this.identityFilename);
      if (!identityFileExists) {
        fs.writeFileSync(this.identityFilename, getIdentity());
      }

      if (!generateDefaultConfigStatus) {
        vscode.window.showWarningMessage('默认配置文件生成失败，请尝试重新下载 OpenSCA-cli', '下载').then(selection => {
          if (selection === '下载') {
            vscode.commands.executeCommand(OPENSCA_DOWNLOAD_CLI_COMMAND);
          }
        });
        return reject(false);
      }

      if (!writeConfigStatus) {
        vscode.window.showWarningMessage(errMsg, '设置').then(selection => {
          if (selection === '设置') {
            vscode.commands.executeCommand(WORKBENCH_ACTION_OPENSETTING, `@ext:xmirror.opensca`);
          }
        });
        return reject(false);
      }

      vscode.commands.executeCommand(OPENSCA_REFRESH_OPERATION_COMMAND);
      try {
        Loger.record('OpenSCA-cli 开始运行');
        const args = ['-config', this.configPath];
        this.scanProcess = child_process.spawn(this.customCliPath, args);
        this.scanProcessRuning = true;
        this.scanProcess.stdout?.on('data', function (data) {
          const spawnData = String(data);
          if (spawnData.indexOf('请求资源不存在') !== -1) {
            resolve(false);
            Loger.error('OpenSCA-cli 运行异常，错误信息：' + String(data));
            vscode.window.showErrorMessage('请求资源不存在，请重新设置token');
            vscode.commands.executeCommand(OPENSCA_REFRESH_OPERATION_COMMAND);
          } else if (spawnData.indexOf('OSS令牌已过期') !== -1 || spawnData.indexOf('OSS令牌不存在') !== -1) {
            resolve(false);
            Loger.error('OpenSCA-cli 运行异常，错误信息：' + String(data));
            vscode.window.showErrorMessage('OSS令牌不存在或OSS令牌已过期，请重新设置token');
            vscode.commands.executeCommand(OPENSCA_REFRESH_OPERATION_COMMAND);
          }
        });
        this.scanProcess.stderr?.on('data', function (data) {
          Loger.error('OpenSCA-cli 运行异常，错误信息：' + data);
        });

        this.scanProcess.on('exit', () => {
          Loger.warning('OpenSCA-cli 退出运行');
        });

        this.scanProcess.on('error', code => {
          resolve(false);
          Loger.error('OpenSCA-cli 进程错误，code：' + code);
          vscode.window.showErrorMessage('OpenSCA-cli 运行异常');
          vscode.commands.executeCommand(OPENSCA_REFRESH_OPERATION_COMMAND);
        });
        this.scanProcess.on('close', () => {
          setTimeout(() => {
            resolve(true);
            Loger.record('OpenSCA-cli 运行结束');
            this.scanProcessRuning = false;
            vscode.commands.executeCommand(OPENSCA_REFRESH_OPERATION_COMMAND);
            this.analysisJson();
          }, 500);
        });
      } catch (error) {
        this.stop();
        resolve(false);
        Loger.error('OpenSCA-cli 运行异常:' + ((error as string) || 'error').toString());
        vscode.window.showErrorMessage('OpenSCA-cli 运行异常');
        vscode.commands.executeCommand(OPENSCA_REFRESH_OPERATION_COMMAND);
      }
    });
  }

  /**
   * 停止检测
   * @returns {void}
   */
  stop(): void {
    if (this.scanProcessRuning) {
      if (this.vsProgress) {
        this.vsProgress.then(() => {
          Loger.warning('点击进程结束');
        });
        this.vsProgress = undefined;
      }
      this.scanProcess.kill();
    } else {
      vscode.window.showInformationMessage('没有在运行的检测任务');
    }
  }

  /**
   * 运行 先用cli生成默认配置文件。再用默认配置文件和现有参数整合成新的配置文件执行cli
   * @returns {void}
   */
  private async generateDefaultConfig(): Promise<boolean> {
    const engineCliDirExists: boolean = fs.existsSync(this.engineCliDir);
    if (!engineCliDirExists) {
      fs.mkdirSync(this.engineCliDir, {
        recursive: true,
      });
    }

    const engineCliExists: boolean = fs.existsSync(this.customCliPath);
    if (!engineCliExists) {
      vscode.window.showWarningMessage('没有找到 OpenSCA-cli', '下载').then(selection => {
        if (selection === '下载') {
          vscode.commands.executeCommand(OPENSCA_DOWNLOAD_CLI_COMMAND);
        }
      });
      return false;
    }

    // 默认文件已存在
    const defaultConfigPathExists: boolean = fs.existsSync(this.defaultConfigPath);
    if (defaultConfigPathExists) {
      return true;
    }

    return new Promise(resolve => {
      vscode.commands.executeCommand(OPENSCA_REFRESH_OPERATION_COMMAND);
      try {
        Loger.record('OpenSCA-cli 开始运行');
        Loger.record('OpenSCA-cli 生成默认配置文件：' + this.defaultConfigPath);
        const args = ['-config', this.defaultConfigPath];
        const scanProcess = child_process.spawn(this.customCliPath, args);
        scanProcess.stdout?.on('data', function (data) {
          const spawnData = String(data);
          if (spawnData.indexOf('请求资源不存在') !== -1) {
            resolve(false);
            Loger.error('OpenSCA-cli 运行异常，错误信息：' + String(data));
          } else if (spawnData.indexOf('OSS令牌已过期') !== -1 || spawnData.indexOf('OSS令牌不存在') !== -1) {
            resolve(false);
            Loger.error('OpenSCA-cli 运行异常，错误信息：' + String(data));
          }
        });
        scanProcess.stderr?.on('data', function (data) {
          Loger.error('OpenSCA-cli 运行异常，错误信息：' + data);
        });

        scanProcess.on('exit', () => {
          Loger.warning('OpenSCA-cli 退出运行');
        });

        scanProcess.on('error', code => {
          resolve(false);
          Loger.error('OpenSCA-cli 进程错误，code：' + code);
        });
        scanProcess.on('close', () => {
          resolve(true);
        });
      } catch (error) {
        resolve(false);
        Loger.error('OpenSCA-cli 运行异常:' + ((error as string) || 'error').toString());
      }
    });
  }

  /**
   * 即时生成cli执行需要的配置文件
   * @returns {Promise<[boolean, string]>}
   */
  private async writeConfig(): Promise<[boolean, string]> {
    const defaultConfigExists: boolean = fs.existsSync(this.defaultConfigPath);
    if (!defaultConfigExists) {
      const writer = fs.createWriteStream(this.defaultConfigPath);
      const downloadDefaultConfStatus = await Service.downloadConfig()
        .then(response => {
          response.data.pipe(writer);
        })
        .then(() => {
          return true;
        })
        .catch(() => {
          return false;
        });
      if (!downloadDefaultConfStatus) {
        return [false, 'OpenSCA-cli 默认配置文件丢失，请重新下载cli工具'];
      }
    }
    const confJson: string = fs.readFileSync(this.defaultConfigPath, 'utf-8') || '{}';

    let conf: ConfType = JSON5.parse(confJson);
    const localDataSource: object = vscode.workspace.getConfiguration('opensca').get('localDataSource') || {};
    const usingRemoteDataSource: boolean = vscode.workspace.getConfiguration('opensca').get('usingRemoteDataSource') || false;
    const usingLocalDataSource: boolean = vscode.workspace.getConfiguration('opensca').get('usingLocalDataSource') || false;
    const confToken = await this.getConfToken();

    if (!usingRemoteDataSource && !usingLocalDataSource) {
      return [false, '请在设置内至少选择一个类型的数据源'];
    }

    if (usingRemoteDataSource && !confToken) {
      return [false, '使用远程数据源需要设置 OpenSCA 平台 token'];
    }
    conf = {
      ...conf,
      path: this.workspacePath,
      out: `${this.outputPathJson},${this.outputPathDsdx}`,
      log: path.join(this.logDir, './cli.log'),
      optional: {
        vuln: false,
        dedup: false,
        dev: false,
      },
    };

    if (usingRemoteDataSource) {
      conf = {
        ...conf,
        origin: {
          url: this.confUrl,
          token: confToken,
        },
      };
    }
    if (usingLocalDataSource) {
      conf = {
        ...conf,
        url: undefined,
        token: undefined,
        origin: localDataSource,
      };
    }
    fs.writeFileSync(this.configPath, JSON.stringify(conf));
    Loger.error(JSON.stringify(conf));
    return [true, 'SUCCESS'];
  }

  /**
   * 解析json报告
   * @returns {void}
   */
  private analysisJson(): void {
    const scanTotal = this.getScanTotal();
    Loger.info('扫描统计' + JSON.stringify(scanTotal));
    if (!scanTotal) {
      vscode.window.showWarningMessage('无法读取OpenSCA-cli 扫描结果');
      vscode.commands.executeCommand(OPENSCA_VIEW_COMMAND, 'project', null);
      return;
    }

    setTimeout(() => {
      vscode.commands.executeCommand(OPENSCA_REFRESH_SCANRESULT_COMMAND);
      vscode.commands.executeCommand(OPENSCA_VIEW_COMMAND, 'project', scanTotal);
    }, 1000);
  }
}
