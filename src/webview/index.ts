import * as vscode from 'vscode';
import { BaseDataType, ComponentDataType, ProjectDataType, VulDataType } from '../common/types';

interface MessageType {
  command: string;
  text: vscode.Uri;
}

export default class Webview {
  protected panel: vscode.WebviewPanel | undefined;
  protected context: vscode.ExtensionContext | undefined;

  init(context: vscode.ExtensionContext, target: string, baseData: BaseDataType | null) {
    this.context = context;
    if (!this.panel) {
      this.panel = vscode.window.createWebviewPanel('openscaView', 'OpenSCA Xcheck', vscode.ViewColumn.Beside, {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.joinPath(this.context ? this.context.extensionUri : vscode.Uri.file('./'), 'resources')],
      });
    }

    switch (target) {
      case 'project':
        this.panel.webview.html = this.getProjWebviewContent(baseData);
        break;
      case 'component':
        this.panel.webview.html = this.getComponentWebviewContent(baseData);
        break;
      case 'vul':
        this.panel.webview.html = this.getVulWebviewContent(baseData);
        break;
      case 'help':
        this.panel.webview.html = this.getHelpWebviewContent();
        break;
    }

    this.panel.webview.onDidReceiveMessage(
      (message: MessageType) => {
        const { command, text } = message;
        switch (command) {
          case 'file':
            text &&
              vscode.workspace.openTextDocument(((text || '') as any as string).split('====').join('\\')).then(document => {
                vscode.window.showTextDocument(document);
              });
            return;
        }
      },
      undefined,
      context.subscriptions
    );

    this.panel.onDidDispose(
      () => {
        this.panel = undefined;
      },
      null,
      this.context ? this.context.subscriptions : []
    );
  }

  /**
   * 当前项目检测结果webview内容
   * @param {any} baseData:null|ProjectDataType=null 基础数据
   * @returns {any}
   */
  getProjWebviewContent(baseData: null | ProjectDataType = null) {
    return `
<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta http-equiv="Content-Security-Policy">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>OepnSCA</title>
  </head>
  <body>
  <style>
  .opensca-view{
    padding: 20px;
    font-size: 14px;
  }
  .task-info {
      margin-bottom: 30px;
  }
  .task-info span{
      margin-right: 30px;
  }
  .box-statistics {
    margin-bottom: 16px;
  }
  .box-statistics .state-title {
    margin-bottom: 16px;
    margin-right: 16px;
  }
  .box-statistics .state-title img{
    margin-right: 12px;
  }
  .box-statistics .state-info div {
    display: inline-flex;
    margin-right: 16px;
    align-items: center;
  }
  .box-statistics .state-info div span  {
    margin-left: 8px;
  }
  .footer button {
    height: 32px;
    padding: 0 12px;
  }
  </style>
  <div class="opensca-view">
    <div class="task-info">
      <span>开始时间：${!baseData ? '?' : baseData.startTime}</span>
      <span>|</span>
      <span>结束时间：${!baseData ? '?' : baseData.endTime}</span>
    </div>

    <section class="box-statistics">
      <div class="state-title"> <img src="${this.picUrl('iconComponent')}" alt="">组件统计</div>
      <div class="state-info">
        <div>
          <img src="${this.picUrl('iconSerious')}" alt=""/>
          <span>严重：${!baseData ? 0 : baseData.component.serious}</span>
        </div>
        <div>
          <img src="${this.picUrl('iconHigh')}" alt=""/>
          <span>高危：${!baseData ? 0 : baseData.component.high}</span>
        </div>
        <div>
          <img src="${this.picUrl('iconMedium')}" alt=""/>
          <span>中危：${!baseData ? 0 : baseData.component.middle}</span>
        </div>
        <div>
          <img src="${this.picUrl('iconLow')}" alt=""/>
          <span>低危：${!baseData ? 0 : baseData.component.low}</span>
        </div>
      </div>
    </section>
    <section class="box-statistics">
      <div class="state-title"> <img src="${this.picUrl('iconVul')}" alt="">漏洞统计</div>
      <div class="state-info">
        <div>
          <img src="${this.picUrl('iconSerious')}" alt=""/>
          <span>严重：${!baseData ? 0 : baseData.vul.serious}</span>
        </div>
        <div>
          <img src="${this.picUrl('iconHigh')}" alt=""/>
          <span>高危：${!baseData ? 0 : baseData.vul.high}</span>
        </div>
        <div>
          <img src="${this.picUrl('iconMedium')}" alt=""/>
          <span>中危：${!baseData ? 0 : baseData.vul.middle}</span>
        </div>
        <div>
          <img src="${this.picUrl('iconLow')}" alt=""/>
          <span>低危：${!baseData ? 0 : baseData.vul.low}</span>
        </div>
      </div>
    </section>

    <section>
    <img src="${this.picUrl('iconTip')}" alt="" style="width:16px; height: 16px;"/>
    <span>更多信息请</span>
    <a href="https://opensca.xmirror.cn" target="_blank">登录平台</a>查看
    </section>
  </div>
  <script>
      const vscode = acquireVsCodeApi();
      const Page = {
        init() {
          this.initTestConf()
        },
        initTestConf () {
          const btn_test = document.getElementById('btn_test')
          
          btn_test.addEventListener('click', () => {
            const item_url = document.getElementById('item_url').value
            const item_token = document.getElementById('item_token').value
            vscode.postMessage({
              command: 'test_conf',
              text: {
                url: item_url,
                token: item_token,
              }
            })
          })
        }
      };
      Page.init()
  </script>
  </body>
  </html>
    `;
  }

  /**
   * 组件详情webview内容
   * @param {any} baseData:null|ProjectDataType=null 基础数据
   * @returns {any}
   */
  getComponentWebviewContent(baseData: null | ComponentDataType = null) {
    if (!!baseData && baseData.paths && baseData.paths.length) {
      baseData.path_str = baseData.paths.map(item => `<p>* ${item}</p>`).join('');
    }
    const iconDict = [this.picUrl('iconNormal'), this.picUrl('iconSerious'), this.picUrl('iconHigh'), this.picUrl('iconMedium'), this.picUrl('iconLow')];
    return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OepnSCA</title>
  </head>
  <body>
    <style>
    .opensca-view{
      padding: 20px;
      font-size: 14px;
    }
    .opensca-view a{
      cursor: pointer;
    }
    .box-header {
      margin-bottom: 30px;
      display: flex;
      align-items: center;
    }
    .box-header img{
      width: 24px;
      margin-right: 8px;
    }
    .box-details div {
      margin-bottom: 12px;
      display: flex;
    }
    .box-details .txt-label {
      margin-right: 8px;
    }
    .box-details .txt-value p{
      padding: 0;
      margin: 0 0 8px;
    }
    </style>
    <div class="opensca-view">
      <div class="box-header">
        <img src="${iconDict[baseData ? baseData.security_level_id : 0]}" alt=""/>
        <span>${!baseData ? '--' : baseData.name}</span>
      </div>
      <section class="box-details">
        <div>
          <span class="txt-label">发布厂商: ${!baseData ? '--' : baseData.vendor || '--'}</span>
          <span class="txt-label">|</span>
          <span class="txt-label">版本号: ${!baseData ? '--' : baseData.version}</span>
        </div>
        <div>
          <span class="txt-label">语言：</span>
          <span class="txt-value">${!baseData ? '--' : baseData.language}</span>
        </div>
        <div>
          <span class="txt-label">依赖类型：</span>
          <span class="txt-value">${!baseData ? '--' : baseData.direct ? '直接依赖' : '间接依赖'}</span>
        </div>
        <div>
          <span class="txt-label">文件位置：</span>
          <span class="txt-value">
            <a id="btn_location">${!baseData ? '--' : baseData.completeLocation}</a>
          </span>
        </div>
        <div>
          <span class="txt-label">组件位置：</span>
          <span class="txt-value">${!baseData ? '--' : baseData.componentPath}</span>
        </div>
        <div>
          <img src="${this.picUrl('iconLicense')}" alt="" style="width:16px; height: 16px; margin-right: 8px;"/>
          <span class="txt-label">许可证：</span>
          <span class="txt-value">${!baseData ? '--' : baseData.licenseStr}</span>
        </div>
      </section>
    </div>
    <script>
        (function() {
            const vscode = acquireVsCodeApi();
            document.getElementById('btn_location').addEventListener('click', function () {
              vscode.postMessage({
                command: 'file',
                text: '${baseData?.completeLocation ? baseData?.completeLocation.split('\\').join('====') : ''}'
              });
            })
        }())
    </script>
  </body>
</html>
    `;
  }

  /**
   * 漏洞详情webview内容
   * @param {any} baseData:null|ProjectDataType=null 基础数据
   * @returns {any}
   */
  getVulWebviewContent(baseData: null | VulDataType = null) {
    const iconDict = [this.picUrl('iconNormal'), this.picUrl('iconSerious'), this.picUrl('iconHigh'), this.picUrl('iconMedium'), this.picUrl('iconLow')];
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>OepnSCA</title>
    </head>
    <body>
    <style>
    .opensca-view{
      max-width: 800px; 
      padding: 20px;
      font-size: 14px;
    }
    .opensca-view a {
      text-decoration: none;
    }
    .box-header {
      margin-bottom: 30px;
      display: flex;
      align-items: center;
    }
    .box-header img{
      width: 24px;
      margin-right: 8px;
    }
    .box-details div {
      margin-bottom: 16px;
      display: flex;
    }
    .box-details .txt-label {
      margin-right: 8px;
    }
    .box-details .txt-value {
      flex: 1;
    }
    </style>
    <div class="opensca-view">
      <div class="box-header">
        <img src="${iconDict[baseData ? baseData.security_level_id : 0]}" alt=""/>
        <span>${!baseData ? '--' : baseData.name}</span>
      </div>
      <section class="box-details">
        <div>
          <span class="txt-label"><a href="https://cve.mitre.org/cgi-bin/cvename.cgi?name=${!baseData ? '' : baseData.cve_id}" target="_blank">${!baseData ? '-' : baseData.cve_id || '-'}</a></span>
          <span class="txt-label">|</span>
          <span class="txt-label"><a href="http://www.cnnvd.org.cn/web/xxk/ldxqById.tag?CNNVD=${!baseData ? '' : baseData.cnnvd_id}" target="_blank">${!baseData ? '-' : baseData.cnnvd_id || '-'}</a></span>
          <span class="txt-label">|</span>
          <span class="txt-label">${!baseData ? '??' : baseData.id}</span>
        </div>
        <div>
          <span class="txt-label">发布日期：</span>
          <span class="txt-value">${!baseData ? '--' : baseData.release_date}</span>
        </div>
        <div>
          <span class="txt-label">攻击类型：</span>
          <span class="txt-value">${!baseData ? '--' : baseData.attack_type}</span>
        </div>
        <div>
          <span class="txt-label">利用难度：</span>
          <span class="txt-value">${baseData && baseData?.exploit_level_id !== null ? '困难' : '容易'}</span>
        </div>
        <div>
          <span class="txt-label">漏洞描述：</span>
          <span class="txt-value">${!baseData ? '--' : baseData.description}</span>
        </div>
        <div>
          <span class="txt-label">修复建议：</span>
          <span class="txt-value">${!baseData ? '--' : baseData.suggestion}</span>
        </div>
      </section>
    </div>
    </body>
    </html>
    `;
  }

  /**
   * 帮助说明webview内容
   * @returns {any}
   */
  getHelpWebviewContent() {
    return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta http-equiv="Content-Security-Policy">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>工具引导</title>
  </head>
  <body>
  <style>
  .opensca-view{
    padding: 20px;
    font-size: 16px;
  }

  .opensca-view img{
    margin-right: 8px;
  }
  .box-header {
    margin-bottom: 30px;
  }
  .box-header h1 {
    font-size: 20px;
    color: #2A6BC7;
    display: flex;
    align-items: center;
  }
  .box-header span{
    margin-right: 30px;
  }
  .box-details div {
    margin-bottom: 18px;
  }
  .box-details h3 {
    display: flex;
    align-items: center;
    margin-bottom: 12px;
    font-size: 16px;
  }
  .box-details .txt-value {
    font-size: 16px;
  }
  </style>
  <div class="opensca-view">
    <div class="box-header">
      <h1>
        <img src="${this.picUrl('iconXmirror')}" alt="icon" style="width: 28px;">
        <span>OpenSCA Xcheck组件漏洞检测工具</span>
      </h1>
      <span>本工具实时检测项目的组件及漏洞信息，开始使用前请先配置检测平台地址。</span>
    </div>
    <section class="box-details">
      <div>
        <h3><img src="${this.picUrl('iconRun')}" alt="icon">开始检测</h3>
        <span class="txt-value">点击操作栏的“Run”，开始检测当前项目内的组件漏洞风险情况</span>
      </div>
      <div>
        <h3><img src="${this.picUrl('iconStop')}" alt="icon">停止检测</h3>
        <span class="txt-value">点击操作栏的“Stop”，停止检测当前项目内的组件漏洞风险情况。</span>
      </div>
      <div>
        <h3><img src="${this.picUrl('iconClear')}" alt="icon">清除检测结果</h3>
        <span class="txt-value">点击操作栏的“Clean”，清除当前项目的检测结果。</span>
      </div>
      <div>
        <h3><img src="${this.picUrl('iconTest')}" alt="icon">连接配置</h3>
        <span class="txt-value">点击操作栏的“Test”按钮，配置平台Url及Token信息，点击“测试连接”按钮可测试连接配置是否正确，连接成功后就可以开始检测啦！</span>
      </div>
      <div>
        <h3><img src="${this.picUrl('iconSetting')}" alt="icon">设置</h3>
        <span class="txt-value">点击操作栏的“Setting”，查看OpenSCA Xcheck相关设置信息。</span>
      </div>
      <div>
        <h3><img src="${this.picUrl('iconHelp')}" alt="icon">使用说明</h3>
        <span class="txt-value">点击操作栏的“Instructions”，查看OpenSCA Xcheck相关使用说明。</span>
      </div>
      <div>
        <h3><img src="${this.picUrl('iconMore')}" alt="icon">查看更多</h3>
        <span class="txt-value">点击操作栏的“See more”，跳转到<a href="https://opensca.xmirror.cn" target="_blank">opensca.xmirror.cn</a>查看OpenSCA Xcheck 更多相关信息。</span>
      </div>
    </section>
  </div>
  </body>
  </html>
    `;
  }

  /**
   * 获取图片路径
   * @param {any} picKey:string
   * @returns {any}
   */
  private getWebViewImgUri(imgRelativePathArgs: string[]) {
    const onDiskPath = vscode.Uri.joinPath(this.context ? this.context.extensionUri : vscode.Uri.file('./'), ...imgRelativePathArgs);
    return this.panel ? this.panel.webview.asWebviewUri(onDiskPath) : '';
  }

  /**
   * 获取指定图片路径
   * @param {any} picKey:string
   * @returns {any}
   */
  private picUrl(picKey: string) {
    const picMap = new Map([
      ['iconXmirror', this.getWebViewImgUri(['resources', 'xmirror_logo.svg'])],
      ['iconRun', this.getWebViewImgUri(['resources', 'dark', 'run.svg'])],
      ['iconTest', this.getWebViewImgUri(['resources', 'dark', 'test.svg'])],
      ['iconStop', this.getWebViewImgUri(['resources', 'dark', 'stop.svg'])],
      ['iconClear', this.getWebViewImgUri(['resources', 'dark', 'clear.svg'])],
      ['iconSetting', this.getWebViewImgUri(['resources', 'dark', 'setting.svg'])],
      ['iconComponent', this.getWebViewImgUri(['resources', 'img', 'fix_suggestion_20.svg'])],
      ['iconVul', this.getWebViewImgUri(['resources', 'img', 'vul_statistics_20.svg'])],
      ['iconSerious', this.getWebViewImgUri(['resources', 'img', 'severity_critical.svg'])],
      ['iconHigh', this.getWebViewImgUri(['resources', 'img', 'severity_high.svg'])],
      ['iconMedium', this.getWebViewImgUri(['resources', 'img', 'severity_medium.svg'])],
      ['iconLow', this.getWebViewImgUri(['resources', 'img', 'severity_low.svg'])],
      ['iconTip', this.getWebViewImgUri(['resources', 'img', 'icon_tip.svg'])],
      ['iconLicense', this.getWebViewImgUri(['resources', 'img', 'license_20.svg'])],
      ['iconHelp', this.getWebViewImgUri(['resources', 'dark', 'help.svg'])],
      ['iconMore', this.getWebViewImgUri(['resources', 'dark', 'more.svg'])],
    ]);
    return picMap.get(picKey) || '';
  }
}
