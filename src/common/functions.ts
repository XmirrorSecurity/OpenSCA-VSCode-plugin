import * as os from 'os';

export function getPlatform(): string {
  const platform = os.platform(); // win32, sunos, openbsd, linux, freebsd, darwin, aix
  const platformMap = new Map([
    ['win32', 'windows'],
    ['linux', 'linux'],
    ['darwin', 'mac'],
  ]);
  return platformMap.get(platform) || 'windows';
}

export function getArch(): string {
  const arch = os.arch(); // x64, arm, arm64, ia32
  const archMap = new Map([
    ['x64', 'amd64'],
    ['arm', 'arm64'],
    ['arm64', 'arm64'],
    ['ia32', '386'],
  ]);
  return archMap.get(arch) || '';
}

export function getEngineCliName(): string {
  const platform = os.platform(); // win32, sunos, openbsd, linux, freebsd, darwin, aix
  const engineCliMap = new Map([
    ['win32', 'opensca-cli.exe'],
    ['linux', 'opensca-cli'],
    ['darwin', 'opensca-cli'],
  ]);
  return engineCliMap.get(platform) || 'opensca-cli';
}

export function getIdentity(): string {
  const _random = (len: number): string => {
    const t = 'qwertyuiopasdfghjklzxcvbnm1234567890';
    let val = '';
    for (let i = 0; i < len; i++) {
      val += t.charAt(Math.floor(Math.random() * t.length));
    }
    return val;
  };
  return `${_random(8)}-${_random(4)}-${_random(4)}-${_random(4)}-${_random(12)}`;
}
