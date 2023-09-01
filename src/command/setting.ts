import * as vscode from 'vscode';
import { WORKBENCH_ACTION_OPENSETTING } from '../common/commands';
import Utils from '../common/utils';
export default class Setting extends Utils {
  constructor() {
    super();
  }
  init() {
    vscode.commands.executeCommand(WORKBENCH_ACTION_OPENSETTING, `@ext:xmirror.opensca`);
  }
}
