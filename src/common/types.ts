import { AxiosResponse } from 'axios';
import { Uri } from 'vscode';
interface ComponentTotalType {
  serious: number;
  high: number;
  middle: number;
  low: number;
}

interface VulTotalType {
  serious: number;
  high: number;
  middle: number;
  low: number;
}
export interface ProjectDataType {
  startTime?: string;
  endTime?: string;
  component: ComponentTotalType;
  vul: VulTotalType;
}

export interface TaskInfoDataType {
  tool_version?: string;
  app_name?: string;
  size?: number;
  start_time?: string;
  end_time?: string;
  cost_time?: number;
}

export interface ComponentDataType {
  security_level_id: number;
  language: string;
  name: string;
  version: string;
  direct: string;
  paths: string[];
  path_str?: string;
  children?: ComponentDataType[];
  vulnerabilities: VulDataType[];
  completeLocation: string;
  location: string;
  componentPath: string;
  completePath: string;
  vendor?: string;
  licenses: [];
  licenseStr: string;
}

export interface VulDataType {
  id: string;
  name: string;
  cve_id: string;
  cnnvd_id: string;
  cwe_id: string;
  release_date: string;
  attack_type: string;
  description: string;
  suggestion: string;
  exploit_level_id?: number;
  security_level_id: number;
}

export type INodeIcon = {
  ['light']: Uri;
  ['dark']: Uri;
};

export interface ResponseDataType {
  code: number;
  message?: string;
  data?: unknown;
}

export interface ResponseType extends AxiosResponse {
  data: ResponseDataType;
}

export interface ReportType {
  task_info: {
    tool_version: string;
    app_name: string;
    start_time: string;
    end_time: string;
    cost_time: number;
    size: number;
  };
  direct: boolean;
  children?: ComponentDataType[];
}

export interface BaseDataType extends ComponentDataType, ProjectDataType, VulDataType {}
