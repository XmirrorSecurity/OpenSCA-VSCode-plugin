import * as vscode from 'vscode';
import OpenscaExtension from './main';

const openscaExtension = new OpenscaExtension();
export function activate(context: vscode.ExtensionContext) {
  openscaExtension.init(context);
}
