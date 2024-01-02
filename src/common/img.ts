import * as path from 'path';
import { Uri } from 'vscode';

const rPath = (...args: string[]): Uri => path.join(__filename, '..', '..', '..', 'resources', ...args) as unknown as Uri;

// 风险标识
export const iconLevelNormal = rPath('img', 'severity_no_rating_24.svg');
export const iconLevelSerious = rPath('img', 'severity_critical_24.svg');
export const iconLevelMedium = rPath('img', 'severity_medium_24.svg');
export const iconLevelHigh = rPath('img', 'severity_high_24.svg');
export const iconLevelLow = rPath('img', 'severity_low_24.svg');

// 操作按钮
export const iconLightBtnRun = rPath('light', 'run.svg');
export const iconDarkBtnRun = rPath('dark', 'run.svg');
export const iconLightBtnStop = rPath('light', 'stop.svg');
export const iconDarkBtnStop = rPath('dark', 'stop.svg');
export const iconLightBtnClear = rPath('light', 'clear.svg');
export const iconDarkBtnClear = rPath('dark', 'clear.svg');
export const iconLightBtnTest = rPath('light', 'test.svg');
export const iconDarkBtnTest = rPath('dark', 'test.svg');
export const iconLightBtnSetting = rPath('light', 'setting.svg');
export const iconDarkBtnSetting = rPath('dark', 'setting.svg');
export const iconDarkBtnHelp = rPath('dark', 'help.svg');
export const iconLightBtnHelp = rPath('light', 'help.svg');
export const iconDarkBtnMore = rPath('dark', 'more.svg');
export const iconLightBtnMore = rPath('light', 'more.svg');
export const iconLightBtnText = rPath('light', 'text.svg');
export const iconDarkBtnText = rPath('dark', 'text.svg');
export const iconLightArrowRight = rPath('light', 'arrow_right.svg');
export const iconDarkArrowRight = rPath('dark', 'arrow_right.svg');
export const iconLightProject = rPath('light', 'project.svg');
export const iconDarkProject = rPath('dark', 'project.svg');

export const iconStop = rPath('img', 'icon_stop.svg');
export const iconRun = rPath('img', 'icon_run.svg');

// iconPath
export const iconPathLevelNormal = {
  light: iconLevelNormal,
  dark: iconLevelNormal,
};
export const iconPathLevelSerious = {
  light: iconLevelSerious,
  dark: iconLevelSerious,
};
export const iconPathLevelMedium = {
  light: iconLevelMedium,
  dark: iconLevelMedium,
};
export const iconPathLevelHigh = {
  light: iconLevelHigh,
  dark: iconLevelHigh,
};
export const iconPathLevelLow = {
  light: iconLevelLow,
  dark: iconLevelLow,
};
export const iconPathBtnRun = {
  light: iconLightBtnRun,
  dark: iconDarkBtnRun,
};
export const iconPathBtnStop = {
  light: iconLightBtnStop,
  dark: iconDarkBtnStop,
};
export const iconPathBtnClear = {
  light: iconLightBtnClear,
  dark: iconDarkBtnClear,
};
export const iconPathBtnTest = {
  light: iconLightBtnTest,
  dark: iconDarkBtnTest,
};
export const iconPathBtnSetting = {
  light: iconLightBtnSetting,
  dark: iconDarkBtnSetting,
};
export const iconPathBtnMore = {
  light: iconLightBtnMore,
  dark: iconDarkBtnMore,
};
export const iconPathBtnHelp = {
  light: iconLightBtnHelp,
  dark: iconDarkBtnHelp,
};
export const iconPathBtnStopActive = {
  light: iconStop,
  dark: iconStop,
};
export const iconPathBtnRunActive = {
  light: iconRun,
  dark: iconRun,
};
export const iconPathBtnText = {
  light: iconLightBtnText,
  dark: iconDarkBtnText,
};

export const iconPathArrowRight = {
  light: iconLightArrowRight,
  dark: iconDarkArrowRight,
};

export const iconPathProject = {
  light: iconLightProject,
  dark: iconDarkProject,
};
