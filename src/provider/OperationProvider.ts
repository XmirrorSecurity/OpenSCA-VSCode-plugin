import * as vscode from 'vscode';
import Scan from '../command/scan';
import { OPENSCA_CLEAR_SCANRESULT_COMMAND, OPENSCA_SCAN_COMMAND, OPENSCA_SETTING_COMMAND, OPENSCA_STOP_COMMAND, OPENSCA_TESTCONF_COMMAND, OPENSCA_VIEW_COMMAND, VSCODE_OPEN_COMMAND } from '../common/commands';
import { iconPathBtnClear, iconPathBtnHelp, iconPathBtnMore, iconPathBtnRun, iconPathBtnRunActive, iconPathBtnSetting, iconPathBtnStop, iconPathBtnStopActive, iconPathBtnTest } from '../common/img';
import { TreeItem } from '../common/utils';

export class OperationProvider implements vscode.TreeDataProvider<TreeItem> {
  protected scan: Scan | undefined = undefined;
  private _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined | void> = new vscode.EventEmitter<TreeItem | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined | void> = this._onDidChangeTreeData.event;

  constructor(
    private workspaceRoot: string | undefined,
    scan: Scan | undefined
  ) {
    this.scan = scan;
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: TreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(): Promise<TreeItem[]> {
    if (!this.workspaceRoot) {
      vscode.window.showInformationMessage('当前窗口没有扫描项目');
      return Promise.resolve([]);
    }

    return Promise.resolve([
      new TreeItem('Run', vscode.TreeItemCollapsibleState.None, this.scan?.scanProcessRuning ? iconPathBtnRun : iconPathBtnRunActive, '', {
        command: OPENSCA_SCAN_COMMAND,
        title: '',
        arguments: [true],
      }),
      new TreeItem('Stop', vscode.TreeItemCollapsibleState.None, this.scan?.scanProcessRuning ? iconPathBtnStopActive : iconPathBtnStop, '', {
        command: OPENSCA_STOP_COMMAND,
        title: '',
        arguments: [true],
      }),
      new TreeItem('Clean', vscode.TreeItemCollapsibleState.None, iconPathBtnClear, '', {
        command: OPENSCA_CLEAR_SCANRESULT_COMMAND,
        title: '',
        arguments: [],
      }),
      new TreeItem('Test connection', vscode.TreeItemCollapsibleState.None, iconPathBtnTest, '', {
        command: OPENSCA_TESTCONF_COMMAND,
        title: '',
        arguments: [],
      }),
      new TreeItem('Setting', vscode.TreeItemCollapsibleState.None, iconPathBtnSetting, '', {
        command: OPENSCA_SETTING_COMMAND,
        title: '',
        arguments: [],
      }),
      new TreeItem('Instructions ', vscode.TreeItemCollapsibleState.None, iconPathBtnHelp, '', {
        command: OPENSCA_VIEW_COMMAND,
        title: '',
        arguments: ['help'],
      }),
      new TreeItem('See more', vscode.TreeItemCollapsibleState.None, iconPathBtnMore, '', {
        command: VSCODE_OPEN_COMMAND,
        title: '',
        arguments: ['https://opensca.xmirror.cn/docs/v1/'],
      }),
    ]);
  }
}
