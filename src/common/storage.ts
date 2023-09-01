import { Event, ExtensionContext, SecretStorage, SecretStorageChangeEvent } from 'vscode';

export interface ISecretStorageAdapter {
  get(key: string): Promise<string | undefined>;
  store(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
  onDidChange: Event<SecretStorageChangeEvent>;
}

export default class Storage implements ISecretStorageAdapter {
  private static _instance: Storage;
  constructor(private secretStorage: SecretStorage) {}

  static init(context: ExtensionContext): void {
    Storage._instance = new Storage(context.secrets);
  }

  static get instance(): Storage {
    return Storage._instance;
  }

  get(key: string): Promise<string | undefined> {
    return this.secretStorage.get(key) as Promise<string | undefined>;
  }

  store(key: string, value: string): Promise<void> {
    return this.secretStorage.store(key, value) as Promise<void>;
  }

  delete(key: string): Promise<void> {
    return this.secretStorage.delete(key) as Promise<void>;
  }

  get onDidChange(): Event<SecretStorageChangeEvent> {
    return this.secretStorage.onDidChange;
  }
}
