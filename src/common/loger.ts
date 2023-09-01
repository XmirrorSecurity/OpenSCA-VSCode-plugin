import dayjs from 'dayjs';
import * as fs from 'fs';
import * as path from 'path';

export default class Loger {
  static extensionPath: string = path.join(__dirname, '../../');
  static logDir: string = path.join(this.extensionPath, '/engine/log/');

  static record(text = '', type = 'info'): void {
    const logDirExists: boolean = fs.existsSync(this.logDir);
    const logFileName = this.logDir + dayjs().format('YYYYMMDD') + '.log';
    text = `[${type}] ${text}`;
    text = `\n[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] ${text}`;

    if (!logDirExists) {
      fs.mkdirSync(this.logDir, {
        recursive: true,
      });
      fs.writeFileSync(logFileName, '');
    }
    fs.appendFileSync(logFileName, text);
  }

  static warning(text = ''): void {
    this.record(text, 'warning');
  }

  static info(text = ''): void {
    this.record(text, 'info');
  }

  static error(text = ''): void {
    this.record(text, 'error');
  }
}
