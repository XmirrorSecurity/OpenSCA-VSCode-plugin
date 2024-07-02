import * as fs from 'fs';
import { isEqual, trim, uniqWith } from 'lodash';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';
import { OPENSCA_TOKEN_KEY } from '../common/commands';
import Storage from '../common/storage';
import { getEngineCliName, getIdentity } from './functions';
import { ComponentDataType, INodeIcon, ReportType, TaskInfoDataType, VulDataType } from './types';

export default class Utils {
  protected extensionPath: string = path.join(__dirname, '../../');
  protected homePath: string = path.join(os.homedir(), '/.vscode/OpenSCA');
  protected outputDir: string = path.join(this.homePath, '/engine/data/');
  protected logDir: string = path.join(this.homePath, '/engine/log/');
  protected defaultConfigPath: string = path.join(this.homePath, '/engine/cli/config.json');
  protected engineCliDir: string = path.join(this.homePath, '/engine/cli/');
  protected engineCliPath: string = path.join(this.homePath, '/engine/cli/', getEngineCliName());
  protected workspacePath = '';

  constructor() {
    const workspaceFolders = vscode.workspace.workspaceFolders || [];
    this.workspacePath = workspaceFolders.length > 0 ? workspaceFolders[0].uri.fsPath : '';
  }

  get customCliPath(): string {
    return trim(vscode.workspace.getConfiguration('opensca').get('cliPath')) || this.engineCliPath;
  }

  get confUrl(): string {
    return trim(vscode.workspace.getConfiguration('opensca').get('remoteUrl')) || this.serverUrl;
  }

  get serverUrl(): string {
    return 'https://opensca.xmirror.cn';
  }

  get identityFilename(): string {
    return path.join(this.workspacePath ? this.workspacePath : this.homePath, '/.vscode/openscaidentity');
  }

  get configPath(): string {
    return path.join(this.workspacePath ? this.workspacePath : this.homePath, '/.vscode/opensca-config.json');
  }

  get outputPath(): string {
    let identity = '';
    const identityFileExists: boolean = fs.existsSync(this.identityFilename);
    if (!identityFileExists) {
      identity = getIdentity();
      fs.mkdirSync(this.identityFilename.replace('openscaidentity', ''), {
        recursive: true,
      });
      fs.writeFileSync(this.identityFilename, identity);
    } else {
      identity = fs.readFileSync(this.identityFilename, 'utf-8');
    }
    return path.join(this.outputDir, identity);
  }

  get outputPathJson(): string {
    return this.outputPath + '.json';
  }

  get outputPathDsdx(): string {
    return this.outputPath + '.dsdx';
  }

  async getConfToken(): Promise<string | undefined> {
    return await Storage.instance.get(OPENSCA_TOKEN_KEY);
  }

  getScanTotal() {
    const list: ComponentDataType[] = this.getScanList();
    const taskInfo = this.getScanTaskInfo();

    const component: Map<number, number> = new Map();
    const vul: Map<number, number> = new Map();
    const vulIds: string[] = [];

    uniqWith(list, (a: ComponentDataType, b: ComponentDataType) => isEqual({ name: a.name, version: a.version, language: a.language }, { name: b.name, version: b.version, language: b.language })).forEach(comItem => {
      const vulList: VulDataType[] = (comItem.vulnerabilities || []).sort((a: VulDataType, b: VulDataType) => a.security_level_id - b.security_level_id);
      if (vulList.length) {
        component.set(vulList[0].security_level_id, (component.get(vulList[0].security_level_id) || 0) + 1);
        vulList.forEach(vulItem => {
          if (vulIds.indexOf(vulItem.id) === -1) {
            vulIds.push(vulItem.id);
            vul.set(vulItem.security_level_id, (vul.get(vulItem.security_level_id) || 0) + 1);
          }
        });
      }
    });

    let componentLevelList = [];
    for (const [key, value] of component) {
      if (value > 0) {
        componentLevelList.push(key);
      }
    }
    componentLevelList = componentLevelList.sort((a, b) => a - b);
    return {
      appName: taskInfo?.app_name,
      startTime: taskInfo?.start_time,
      endTime: taskInfo?.end_time,
      securityId: componentLevelList[0],
      component: {
        serious: component.get(1) || 0,
        high: component.get(2) || 0,
        middle: component.get(3) || 0,
        low: component.get(4) || 0,
      },
      vul: {
        serious: vul.get(1) || 0,
        high: vul.get(2) || 0,
        middle: vul.get(3) || 0,
        low: vul.get(4) || 0,
      },
    };
  }

  getScanPaths(): string[] {
    const list: ComponentDataType[] = this.getScanList();
    const pathList: string[] = [];

    list.forEach(item => {
      const path = item.paths[0];
      // const itemPath = path.slice(0, path.indexOf('/[')).replace(this.workspacePath.replace(/\\/g, '/'), '');
      const itemPath = path.slice(0, path.indexOf('\\['));
      if (pathList.indexOf(itemPath) === -1) {
        pathList.push(itemPath);
      }
    });

    return pathList;
  }

  getScanComponent(selectFile: string): ComponentDataType[] {
    const list: ComponentDataType[] = this.getScanList();
    const componentList: ComponentDataType[] = [];

    list.forEach(item => {
      if (item.location === selectFile) {
        componentList.push(item);
      }
    });

    return componentList;
  }

  getScanVul(nameVersion: string): VulDataType[] {
    const list: ComponentDataType[] = this.getScanList();
    const currComponent = list.find(item => `${item.name}-${item.version}` === nameVersion);
    if (!currComponent) {
      return [];
    }
    return currComponent.vulnerabilities;
  }

  getScanTaskInfo(): TaskInfoDataType {
    let outputJson = '';
    const outputJsonExists = fs.existsSync(this.outputPathJson);
    if (outputJsonExists) {
      outputJson = fs.readFileSync(this.outputPathJson, 'utf-8');
    } else {
      return {};
    }
    const outputRes: ReportType = <ReportType>JSON.parse(outputJson);
    return outputRes.task_info;
  }

  getScanList(): ComponentDataType[] | [] {
    let outputJson = '';
    const outputJsonExists = fs.existsSync(this.outputPathJson);
    if (outputJsonExists) {
      outputJson = fs.readFileSync(this.outputPathJson, 'utf-8');
    } else {
      return [];
    }
    const outputRes: ReportType = <ReportType>JSON.parse(outputJson);
    const list: ComponentDataType[] = [];

    const _forEachChildren = (childrenItem: ComponentDataType) => {
      if (childrenItem.vulnerabilities) {
        list.push(childrenItem);
      }

      if (childrenItem.children) {
        (childrenItem.children || []).forEach(item => {
          _forEachChildren(item);
        });
      }
    };

    (outputRes.children || []).forEach(item => {
      _forEachChildren(item);
    });

    const _uniqWith = (list: ComponentDataType[]) => {
      return uniqWith(list, (a, b) => isEqual({ name: a.name, version: a.version, language: a.language }, { name: b.name, version: b.version, language: b.language }));
    };

    const newList = _uniqWith(list);
    return newList.map(item => {
      const completePath = item.paths[0];
      const completeLocation = completePath.slice(0, completePath.indexOf('\\['));
      const location = completeLocation.replace(this.workspacePath.replace(/\\/g, '/'), '');
      const componentPath = completePath.slice(completePath.indexOf('\\[') + 1).replace(/\\\[/g, '->[');
      const vulList = (item.vulnerabilities || []).sort((a: VulDataType, b: VulDataType) => a.security_level_id - b.security_level_id);
      if (vulList.length) {
        item.security_level_id = vulList[0].security_level_id;
      } else {
        item.security_level_id = 0;
      }

      interface ItemLicense {
        name: string;
      }
      return {
        ...item,
        licenseStr: (item.licenses || []).map((itemLicense: ItemLicense) => itemLicense.name).join(','),
        vulnerabilities: (item.vulnerabilities || []).map(item => ({ ...item, cve_id: item.cve_id || '', cnnvd_id: item.cnnvd_id || '' })),
        completeLocation: this.workspacePath + '' + completeLocation.slice(completePath.indexOf('\\')),
        completePath,
        componentPath,
        location,
      };
    });
  }
}

export class TreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    icon: INodeIcon,
    public type: string = '',
    public readonly command?: vscode.Command
  ) {
    super(label, collapsibleState);
    this.tooltip = `${this.label}`;
    this.description = '';
    this.iconPath = icon;
    this.type = type;
  }
}
