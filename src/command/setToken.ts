import { isObject } from 'lodash';
import open from 'open';
import * as vscode from 'vscode';
import { OPENSCA_GET_TOKEN_COMMAND, OPENSCA_SET_TOKEN_COMMAND, OPENSCA_TOKEN_KEY } from '../common/commands';
import Loger from '../common/loger';
import Storage from '../common/storage';
import Utils from '../common/utils';
import Service, { TokenResponseType } from '../service';

interface ISetToken {
  toSetToken(): Promise<void>;
  toGetToken(): void;
}

export default class SetToken extends Utils implements ISetToken {
  private interval: NodeJS.Timeout | null = null;
  private tokenId = '';
  protected vsProgress: Thenable<boolean> | undefined;

  constructor() {
    super();
  }

  /**
   * 点击设置token
   * @returns {void}
   */
  async toSetToken(): Promise<void> {
    Loger.info('点击设置token');
    const token = await vscode.window.showInputBox({
      placeHolder: 'xxxxxx-xxxx-xxxx-xxxx-xxxxxxxx',
      password: true,
      validateInput: token => {
        if (!token) {
          return '请从opensca.xmirror.cn生成token并输入';
        }
      },
    });

    if (!token) return;
    return await Storage.instance
      .store(OPENSCA_TOKEN_KEY, token)
      .then(() => {
        Loger.info('Token 设置成功');
        vscode.window.showInformationMessage('OpenSCA Token 设置成功');
      })
      .catch(() => {
        Loger.error('Token 设置失败');
        vscode.window.showErrorMessage('OpenSCA Token 设置失败', '重新输入').then(selection => {
          if (selection === '重新输入') {
            Loger.info('Token 设置失败，点击了重新输入');
            vscode.commands.executeCommand(OPENSCA_SET_TOKEN_COMMAND);
          }
        });
      });
  }

  /**
   * 点击获取token
   * @returns {void}
   */
  toGetToken(): void {
    if (this.vsProgress) {
      vscode.window.showWarningMessage(`正在获取token，请耐心等待`);
      return;
    }
    this.tokenId = 'opensca_' + new Date().getTime();
    const skipUrl = `${this.serverUrl}/auth?tokenid=${this.tokenId}&from=vscode`;
    vscode.window.showInformationMessage('正在尝试打开默认浏览器跳转到opensca.xmirror.cn获取token', '继续', '复制跳转链接', '取消').then(selection => {
      if (selection === '继续') {
        open(skipUrl);
        this.getToken();
      } else if (selection === '复制跳转链接') {
        vscode.env.clipboard.writeText(skipUrl);
        vscode.window.showInformationMessage(`复制成功`);
        setTimeout(() => {
          this.getToken();
        }, 1000);
      } else if (selection === '取消') {
        Loger.warning('点击取消了获取token');
      }
    });
  }

  /**
   * 获取token
   * @returns {void}
   */
  private getToken(): void {
    this.vsProgress = vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'OpenSCA Xcheck正在获取 OSS Token',
        cancellable: true,
      },
      async (_, token) => {
        token.onCancellationRequested(() => {
          this.cancel();
        });
        return new Promise((resolve, reject) => {
          this.interval = setInterval(
            () =>
              this.autoGetTokenService(
                () => resolve(true),
                () => reject(false)
              ),
            5000
          );
          // 时间过长打断操作
          setTimeout(() => {
            if (!this.vsProgress) {
              return;
            }
            reject(false);
            this.cancel();
            Loger.warning('token获取超时');
            vscode.window.showWarningMessage('token获取超时', '重新获取', '取消').then(selection => {
              if (selection === '重新获取') {
                vscode.commands.executeCommand(OPENSCA_GET_TOKEN_COMMAND);
              } else if (selection === '取消') {
                Loger.warning('点击取消了重新获取token');
              }
            });
          }, 1000 * 60);
        });
      }
    );
  }

  /**
   * 取消获取token
   * @returns {void}
   */
  private cancel(): void {
    if (this.vsProgress) {
      this.vsProgress.then(() => {
        Loger.info('结束获取 OSS Token.');
      });
      this.vsProgress = undefined;
    }
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  /**
   * 从服务端自动获取token
   * @returns {void}
   */
  private async autoGetTokenService(resolve: { (): void }, reject: { (): void }) {
    const res: TokenResponseType = await Service.ossToken(this.tokenId);
    if (isObject(res) && res.code !== 0) {
      reject();
      this.cancel();
      vscode.window.showWarningMessage('服务器请求异常', '重新获取').then(selection => {
        if (selection === '重新获取') {
          vscode.commands.executeCommand(OPENSCA_GET_TOKEN_COMMAND);
        }
      });
      return false;
    }

    const { code, token } = res?.data || { code: 404 };
    if (code === 401) {
      reject();
      this.cancel();
      vscode.window.showWarningMessage('平台未生成token，请在平台生成token后重新获取', '重新获取').then(selection => {
        if (selection === '重新获取') {
          vscode.commands.executeCommand(OPENSCA_GET_TOKEN_COMMAND);
        }
      });
    }

    if (code !== 200) {
      return false;
    }
    if (token) {
      this.cancel();
      Storage.instance
        .store(OPENSCA_TOKEN_KEY, token || '')
        .then(() => {
          resolve();
          Loger.info('Token 设置成功');
          vscode.window.showInformationMessage('OpenSCA Token 设置成功');
        })
        .catch(() => {
          reject();
          Loger.error('Token 设置失败');
          vscode.window.showErrorMessage('OpenSCA Token 设置失败', '重新获取').then(selection => {
            if (selection === '重新获取') {
              Loger.info('Token 设置失败，点击了重新获取');
              vscode.commands.executeCommand(OPENSCA_GET_TOKEN_COMMAND);
            }
          });
        });
    }
  }
}
