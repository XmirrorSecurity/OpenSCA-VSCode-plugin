import * as fs from 'fs';
import * as vscode from 'vscode';
import { OPENSCA_OPEN_DOC } from '../common/commands';
import Utils from '../common/utils';

export default class ExportReport extends Utils {
  constructor() {
    super();
  }
  init(): void {
    const outputPathExists: boolean = fs.existsSync(this.outputPathJson);
    if (!outputPathExists) {
      vscode.window.showWarningMessage('没有找到当前项目的扫描结果');
      return;
    }
    vscode.commands.executeCommand(OPENSCA_OPEN_DOC, this.outputPathJson);
  }
}
