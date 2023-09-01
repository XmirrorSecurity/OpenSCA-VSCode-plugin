import * as fs from 'fs';
import * as vscode from 'vscode';

export default class OpenDoc {
  init(filePath: string): void {
    if (!filePath) {
      return;
    }
    const filePathExists: boolean = fs.existsSync(filePath);
    if (!filePathExists) {
      return;
    }
    vscode.workspace.openTextDocument(filePath).then(document => {
      vscode.window.showTextDocument(document);
    });
  }
}
