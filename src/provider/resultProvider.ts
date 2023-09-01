import * as fs from 'fs';
import * as vscode from 'vscode';
import { OPENSCA_REFRESH_SCANRESULT_COMMAND, OPENSCA_VIEW_COMMAND } from '../common/commands';
import { iconPathBtnText, iconPathLevelHigh, iconPathLevelLow, iconPathLevelMedium, iconPathLevelNormal, iconPathLevelSerious } from '../common/img';
import { ComponentDataType, INodeIcon, VulDataType } from '../common/types';
import Utils, { TreeItem } from '../common/utils';

export class ResultProvider extends Utils implements vscode.TreeDataProvider<TreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined | void> = new vscode.EventEmitter<TreeItem | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined | void> = this._onDidChangeTreeData.event;

  constructor(private workspaceRoot: string | undefined) {
    super();
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  clear(): void {
    const reportExists: boolean = fs.existsSync(this.outputPath);
    if (reportExists) {
      fs.unlink(this.outputPath, function (err) {
        if (err) {
          vscode.window.showErrorMessage('清除检测结果异常');
          return console.error(err);
        }
        vscode.window.showInformationMessage('已经清除当前项目的检测结果');
        vscode.commands.executeCommand(OPENSCA_REFRESH_SCANRESULT_COMMAND);
      });
    } else {
      vscode.window.showWarningMessage('当前还没有检测结果');
    }
  }

  getTreeItem(element: TreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: TreeItem): Promise<never | TreeItem[]> {
    if (!this.workspaceRoot) {
      vscode.window.showInformationMessage('当前窗口没有扫描项目');
      return Promise.resolve([]);
    }
    const res: ComponentDataType[] = this.getScanList();
    if (res.length === 0) {
      return Promise.resolve([]);
    }

    if (element && element?.type === 'component') {
      const list: VulDataType[] = this.getScanVul(element?.label);
      return Promise.resolve(
        (list || []).map(item => {
          return new TreeItem(`${item.name}-${item.id}`, vscode.TreeItemCollapsibleState.None, this._iconByLevelId(item.security_level_id), '', {
            command: OPENSCA_VIEW_COMMAND,
            title: '',
            arguments: ['vul', item],
          });
        })
      );
    } else if (element && element?.type === 'path') {
      const list: ComponentDataType[] = this.getScanComponent(element?.label);
      return Promise.resolve(
        (list || []).map(item => {
          return new TreeItem(`${item.name}-${item.version}`, item.vulnerabilities && item.vulnerabilities.length ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None, this._iconByLevelId(item.security_level_id), 'component', {
            command: OPENSCA_VIEW_COMMAND,
            title: '',
            arguments: ['component', item],
          });
        })
      );
    } else {
      const resTotal = this.getScanTotal();
      const list: string[] = this.getScanPaths();
      const treeList = (list || []).map(item => {
        return new TreeItem(item, vscode.TreeItemCollapsibleState.Collapsed, iconPathBtnText, 'path');
      });
      return Promise.resolve([
        new TreeItem(resTotal?.appName || '当前项目', vscode.TreeItemCollapsibleState.None, this._iconByLevelId(resTotal?.securityId || 0), '', {
          command: OPENSCA_VIEW_COMMAND,
          title: '',
          arguments: ['project', resTotal],
        }),
        ...treeList,
      ]);
    }
  }

  _iconByLevelId(levelId = 0): INodeIcon {
    levelId = levelId ? levelId : 0;
    const dict: INodeIcon[] = [iconPathLevelNormal, iconPathLevelSerious, iconPathLevelHigh, iconPathLevelMedium, iconPathLevelLow];
    return dict[levelId];
  }
}
