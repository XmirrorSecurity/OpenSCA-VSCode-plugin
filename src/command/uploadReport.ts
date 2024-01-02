import * as fs from 'fs';
import * as vscode from 'vscode';
import { QuickPickItem, QuickPickItemKind, ThemeIcon } from 'vscode';
import { VSCODE_OPEN_COMMAND } from '../common/commands';
import { iconPathArrowRight, iconPathProject } from '../common/img';
import Loger from '../common/loger';
import Utils from '../common/utils';
import Service from '../service';

interface IUploadReport {
  init(): void;
}

interface TeamItemType {
  teamName: string;
  projectList: projectItemType[];
}

interface projectItemType {
  name: string;
  projectUid: string;
}

export default class UploadReport extends Utils implements IUploadReport {
  protected vsProgress: Thenable<boolean> | undefined;

  constructor() {
    super();
  }

  init(): void {
    const outputJsonExists: boolean = fs.existsSync(this.outputPathJson);
    const outputDsdxExists: boolean = fs.existsSync(this.outputPathDsdx);
    if (!outputJsonExists || !outputDsdxExists) {
      vscode.window.showWarningMessage('没有找到当前项目的扫描结果');
      return;
    }
    Loger.info('上传json,dsdx报告到SaaS指定项目下');
    this.toSelectProject();
  }

  /**
   * 点击设置token
   * @returns {void}
   */
  private async toSelectProject(): Promise<void> {
    const projectSelect: any[] = (await Service.getProjectSelect()) || [];
    if (!projectSelect.length) {
      vscode.window.showErrorMessage('无法获取项目列表');
      return;
    }

    const selectItems: QuickPickItem[] = [
      {
        iconPath: iconPathArrowRight as unknown as ThemeIcon,
        label: '快速检测',
        detail: '直接同步结果到快速检测',
        description: undefined,
      },
    ];

    projectSelect.forEach((teamItem: TeamItemType) => {
      if (teamItem.projectList.length) {
        selectItems.push({ kind: QuickPickItemKind.Separator, label: teamItem.teamName });
        (teamItem.projectList || [])
          .filter(item => !!item)
          .forEach((projectItem: projectItemType) => {
            selectItems.push({
              iconPath: iconPathProject as unknown as ThemeIcon,
              label: projectItem.name,
              description: projectItem.projectUid + '',
            });
          });
      }
    });
    const selectedItem: QuickPickItem | undefined = await vscode.window.showQuickPick(selectItems, {
      placeHolder: '选择项目，上传检测结果到所选项目下',
      onDidSelectItem: (item: QuickPickItem) => {
        return item;
      },
    });
    if (selectedItem) {
      this.doSyncReport(selectedItem?.description);
    }
  }

  /**
   * 同步检测结果到saas
   * @returns {void}
   */
  private doSyncReport(projectId: string | undefined): void {
    this.vsProgress = vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'OpenSCA Xcheck正在同步检测结果到 SaaS',
        cancellable: true,
      },
      async (_, token) => {
        token.onCancellationRequested(() => {
          this.cancel();
        });
        const [resSyncReport, resData] = await Service.syncReport(projectId);
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            if (!resSyncReport) {
              reject(false);
            } else {
              resolve(true);
              vscode.window.showInformationMessage('检测结果已同步 SaaS 平台', '查看详情').then(selection => {
                if (selection === '查看详情') {
                  Loger.record('点击在SaaS平台查看详情', 'info');
                  vscode.commands.executeCommand(VSCODE_OPEN_COMMAND, 'https://opensca.xmirror.cn/' + resData);
                }
              });
            }
          }, 3000);
        });
      }
    );
  }

  /**
   * 取消同步
   * @returns {void}
   */
  private cancel(): void {
    if (this.vsProgress) {
      this.vsProgress.then(() => {
        Loger.info('取消同步检测结果到SaaS.');
      });
      this.vsProgress = undefined;
    }
  }
}
