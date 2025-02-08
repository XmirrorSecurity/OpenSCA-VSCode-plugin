import * as vscode from 'vscode';
import DownloadCli from '../command/downloadCli';
import ExportReport from '../command/exportReport';
import OpenDoc from '../command/openDoc';
import Scan from '../command/scan';
import SetToken from '../command/setToken';
import Setting from '../command/setting';
import TestConf from '../command/testConf';
import UploadReport from '../command/uploadReport';
import {
  OPENSCA_CLEAR_SCANRESULT_COMMAND,
  OPENSCA_DOWNLOAD_CLI_COMMAND,
  OPENSCA_EXPLORER_OPERATION_COMMAND,
  OPENSCA_EXPLORER_SCANRESULTS_COMMAND,
  OPENSCA_EXPORT,
  OPENSCA_GET_TOKEN_COMMAND,
  OPENSCA_OPEN_DOC,
  OPENSCA_REFRESH_OPERATION_COMMAND,
  OPENSCA_REFRESH_SCANRESULT_COMMAND,
  OPENSCA_SCAN_COMMAND,
  OPENSCA_SETTING_COMMAND,
  OPENSCA_SET_TOKEN_COMMAND,
  OPENSCA_STOP_COMMAND,
  OPENSCA_TESTCONF_COMMAND,
  OPENSCA_UPLOAD_REPORT_COMMAND,
  OPENSCA_VIEWS_OPERATION_COMMAND,
  OPENSCA_VIEWS_SCANRESULTS_COMMAND,
  OPENSCA_VIEW_COMMAND,
} from '../common/commands';

import Storage from '../common/storage';
import { BaseDataType } from '../common/types';
import { OperationProvider } from '../provider/OperationProvider';
import { ResultProvider } from '../provider/resultProvider';
import Webview from '../webview';

const rootPath = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0 ? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;
const setToken = new SetToken();
const downloadCli = new DownloadCli();
const scan = new Scan();
const setting = new Setting();
const testConf = new TestConf();
const webview = new Webview();
const openDoc = new OpenDoc();
const exportReport = new ExportReport();
const operationProvider = new OperationProvider(rootPath, scan);
const resultProvider = new ResultProvider(rootPath);
const uploadReport = new UploadReport();

export default class OpenscaExtension {
  context!: vscode.ExtensionContext;

  public init(context: vscode.ExtensionContext) {
    Storage.init(context);
    console.log('[OpenSCA Xcheck] OpenSCA-vscode 正在运行');
    this.context = context;
    this.registerCommands(context);
    this.registerTreeDataProviders(context);
  }

  private registerCommands(context: vscode.ExtensionContext): void {
    const doGetToken = vscode.commands.registerCommand(OPENSCA_GET_TOKEN_COMMAND, () => setToken.toGetToken());
    const doSetToken = vscode.commands.registerCommand(OPENSCA_SET_TOKEN_COMMAND, () => setToken.toSetToken());
    const doDownloadCli = vscode.commands.registerCommand(OPENSCA_DOWNLOAD_CLI_COMMAND, () => downloadCli.init());
    const doStartScan = vscode.commands.registerCommand(OPENSCA_SCAN_COMMAND, () => scan.start());
    const doStopScan = vscode.commands.registerCommand(OPENSCA_STOP_COMMAND, () => scan.stop());
    const doRefreshResults = vscode.commands.registerCommand(OPENSCA_REFRESH_SCANRESULT_COMMAND, () => resultProvider.refresh());
    const doRefreshOperation = vscode.commands.registerCommand(OPENSCA_REFRESH_OPERATION_COMMAND, () => operationProvider.refresh());
    const doClearResult = vscode.commands.registerCommand(OPENSCA_CLEAR_SCANRESULT_COMMAND, () => resultProvider.clear());
    const doTestConf = vscode.commands.registerCommand(OPENSCA_TESTCONF_COMMAND, () => testConf.init());
    const doOpenDoc = vscode.commands.registerCommand(OPENSCA_OPEN_DOC, (filePath: string) => openDoc.init(filePath));
    const doExportReport = vscode.commands.registerCommand(OPENSCA_EXPORT, () => exportReport.init());
    const registerSetting = vscode.commands.registerCommand(OPENSCA_SETTING_COMMAND, () => setting.init());
    const registerWebview = vscode.commands.registerCommand(OPENSCA_VIEW_COMMAND, (target: string, baseData: BaseDataType | null) => webview.init(context, target, baseData));
    const doUploadReport = vscode.commands.registerCommand(OPENSCA_UPLOAD_REPORT_COMMAND, () => uploadReport.init());

    context.subscriptions.push(doGetToken, doSetToken, doDownloadCli, doStartScan, doStopScan, doTestConf, doRefreshResults, doRefreshOperation, doClearResult, doOpenDoc, doExportReport, registerSetting, registerWebview, doUploadReport);
  }

  private registerTreeDataProviders(context: vscode.ExtensionContext): void {
    const operationFeedbackForExplorer = vscode.window.registerTreeDataProvider(OPENSCA_EXPLORER_OPERATION_COMMAND, operationProvider);
    const helpAndFeedbackForExplorer = vscode.window.registerTreeDataProvider(OPENSCA_EXPLORER_SCANRESULTS_COMMAND, resultProvider);
    const operationFeedback = vscode.window.registerTreeDataProvider(OPENSCA_VIEWS_OPERATION_COMMAND, operationProvider);
    const treeDataResult = vscode.window.registerTreeDataProvider(OPENSCA_VIEWS_SCANRESULTS_COMMAND, resultProvider);

    context.subscriptions.push(operationFeedback, treeDataResult, operationFeedbackForExplorer, helpAndFeedbackForExplorer);
  }
}
