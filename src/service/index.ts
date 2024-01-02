import { to } from 'await-to-js';
import axios, { AxiosResponse, CancelTokenSource } from 'axios';
import FormData from 'form-data';
import * as fs from 'fs';
import { isObject } from 'lodash';
import * as stream from 'stream';
import * as vscode from 'vscode';
import { OPENSCA_TOKEN_KEY } from '../common/commands';
import { getArch, getPlatform } from '../common/functions';
import Loger from '../common/loger';
import Storage from '../common/storage';
import { ResponseDataType, ResponseType } from '../common/types';
import Utils from '../common/utils';
export interface DownloadResponseType extends AxiosResponse {
  data: ArrayBufferView;
}

export interface StreamAxiosResponse extends AxiosResponse {
  data: stream.Readable;
}

export interface TokenAxiosResponse extends AxiosResponse {
  data: TokenResponseType;
}

export interface DefaultAxiosResponse extends AxiosResponse {
  data: VersionResponseType;
}

export interface VersionResponseType extends ResponseDataType {
  data?: unknown;
}

interface ITokenAndCode {
  code: number;
  token: string | null;
}
export interface TokenResponseType extends ResponseDataType {
  data?: ITokenAndCode;
}

export type DownloadAxiosResponse = { data: stream.Readable; headers: { [header: string]: unknown } };

export default class Service extends Utils {
  static readonly downloadUri: string = '/oss-saas/api-v1/ide-plugin/open-sca-cli/download';
  static readonly versionUri: string = '/oss-saas/api-v1/ide-plugin/open-sca-cli/version';
  static readonly authTokenUri: string = '/oss-saas/api-v1/oss-token/get/auth';
  static readonly testConnectUri: string = '/oss-saas/api-v1/oss-token/test';
  static readonly downloadConfigUri: string = '/oss-saas/api-v1/ide-plugin/open-sca-cli/config/download';
  static readonly projectSelectUri: string = '/oss-saas/api-v1/ide-plugin/project/select';
  static readonly syncReportUri: string = '/oss-saas/api-v1/ide-plugin/sync/result';

  static get confToken(): string {
    return vscode.workspace.getConfiguration('opensca').get('remoteToken') || '';
  }
  static get confUrl(): string {
    return vscode.workspace.getConfiguration('opensca').get('remoteUrl') || '';
  }

  static get serverUrl(): string {
    const utils = new Utils();
    return utils.serverUrl;
  }

  static async getConfToken(): Promise<string | undefined> {
    return await Storage.instance.get(OPENSCA_TOKEN_KEY);
  }

  /**
   * 下载OpenSCA-cli
   * @returns {[Promise<DownloadAxiosResponse>, CancelTokenSource]}
   */
  static downloadCli(): [Promise<DownloadAxiosResponse>, CancelTokenSource] {
    const axiosCancelToken = axios.CancelToken.source();
    const response = axios.get(this.serverUrl + '' + this.downloadUri, {
      params: {
        osName: getPlatform(),
        arch: getArch(),
      },
      cancelToken: axiosCancelToken.token,
      responseType: 'stream',
    });
    return [response as Promise<DownloadAxiosResponse>, axiosCancelToken];
  }

  /**
   * 下载OpenSCA-cli的默认配置文件config.json
   * @returns {Promise<any>}
   */
  static async downloadConfig(): Promise<DownloadAxiosResponse> {
    return axios.get(this.serverUrl + '' + this.downloadConfigUri, {
      responseType: 'stream',
    });
  }

  /**
   * 获取最新版本号
   * @returns {Promise<any>}
   */
  static async lastVersion(): Promise<VersionResponseType> {
    let err: unknown = undefined;
    let res: ResponseType | undefined = undefined;
    [err, res] = await to(axios.get(this.serverUrl + '' + this.versionUri));
    if (isObject(err) || (res && !res.data)) {
      vscode.window.showWarningMessage('获取最新版本信息异常');
      return { code: 1, data: '' };
    }
    return res?.data || { code: 1, data: '' };
  }

  /**
   * 获取ossToken
   * @returns {Promise<any>}
   */
  static async ossToken(tokenId: string): Promise<TokenResponseType> {
    let err: unknown = undefined;
    let res: TokenAxiosResponse | undefined = undefined;
    [err, res] = await to(axios.get(this.serverUrl + '' + this.authTokenUri + '/' + tokenId));
    if (isObject(err) || (res && res?.status !== 200)) {
      vscode.window.showWarningMessage('远程服务异常');
      return { code: 1 };
    }
    return res?.data || { code: 1 };
  }

  /**
   * 测试连接
   * @returns {Promise<boolean>}
   */
  static async testConnect(): Promise<boolean> {
    const confToken = await this.getConfToken();
    if (!confToken) {
      vscode.window.showWarningMessage('请先完善配置信息->OpenSCA 平台Token');
      return false;
    }
    let err: unknown = undefined;
    let res: DefaultAxiosResponse | undefined = undefined;
    [err, res] = await to(
      axios.get(this.serverUrl + '' + this.testConnectUri, {
        params: {
          ossToken: confToken,
        },
      })
    );
    if (isObject(err) || (res && res?.status !== 200)) {
      vscode.window.showErrorMessage('连接失败');
      return false;
    }
    if (res && res.data && res.data.code !== 0) {
      vscode.window.showErrorMessage('连接失败');
      return false;
    }
    vscode.window.showInformationMessage('连接成功');
    return true;
  }

  /**
   * 根据用户Token获取项目列表
   * @returns {Promise<any[]>}
   */
  static async getProjectSelect(): Promise<any[] | false> {
    const confToken = await this.getConfToken();
    if (!confToken) {
      vscode.window.showWarningMessage('请先完善配置信息->OpenSCA 平台Token');
      return false;
    }
    let err: unknown = undefined;
    let res: DefaultAxiosResponse | undefined = undefined;
    [err, res] = await to(
      axios.get(this.serverUrl + '' + this.projectSelectUri, {
        params: {
          ossToken: confToken,
        },
      })
    );

    if (isObject(err) || (res && res?.status !== 200)) {
      return false;
    }
    if (res && res.data && res.data.code !== 0) {
      return false;
    }
    return (res?.data?.data || []) as unknown[];
  }

  /**
   * 同步当前项目的报告到saas平台
   * @returns {Promise<any[]>}
   */
  static async syncReport(projectUid: string | undefined): Promise<[boolean, string?]> {
    const utils = new Utils();
    const confToken = await this.getConfToken();
    if (!confToken) {
      vscode.window.showWarningMessage('请先完善配置信息->OpenSCA 平台Token');
      return [false];
    }

    const formData = new FormData();
    const jsonFileStream = fs.createReadStream(utils.outputPathJson);
    jsonFileStream.on('end', () => {
      jsonFileStream.close();
    });
    jsonFileStream.on('error', err => {
      Loger.error(`在读取文件时发生错误: ${err}`);
    });
    formData.append('jsonFile', jsonFileStream);

    const dsdxFileStream = fs.createReadStream(utils.outputPathDsdx);
    dsdxFileStream.on('end', () => {
      dsdxFileStream.close();
    });
    formData.append('dsdxFile', dsdxFileStream);

    const headers = formData.getHeaders();
    const len = await new Promise((resolve, reject) => {
      return formData.getLength((err, length) => (err ? reject(err) : resolve(length)));
    });

    headers['Content-Length'] = len;

    let err: unknown = undefined;
    let res: DefaultAxiosResponse | undefined = undefined;
    [err, res] = await to(
      axios({
        url: this.serverUrl + '' + this.syncReportUri,
        method: 'POST',
        data: formData,
        params: {
          // version: '1.0',
          detectOrigin: 3,
          token: confToken,
          projectUid: projectUid,
        },
        headers: {
          ...headers,
        },
      })
    );
    if (isObject(err) || (res && res?.status !== 200)) {
      vscode.window.showErrorMessage('同步失败');
      return [false];
    }
    if (res && res.data && res.data.code !== 0) {
      if (res.data.code === 8000012) {
        vscode.window.showWarningMessage('检测记录已同步到 SaaS 端，请勿重复操作');
      } else {
        vscode.window.showErrorMessage('同步失败');
      }
      return [false];
    }

    return [true, res?.data?.data ? String(res?.data?.data) : ''];
  }
}
