import { Inject, Injectable } from '@nestjs/common';
import { SettingsStore } from '../Settings/SettingsStore';
import { SETTINGS_PROVIDER } from '../Settings/Settings.types';
import { transactionIncrement } from '@/utils/transaction-increment';

const COLLECTION_FORMAT_FALLBACKS: Record<
  string,
  { prefix: string; suffix: string; next?: string }
> = {
  payment_receives_cash: { prefix: 'CIH-', suffix: '' },
  payment_receives_bank_transfer: { prefix: 'PAY-', suffix: '-BT' },
  payment_receives_bank_deposit: { prefix: 'PAY-', suffix: '-BD' },
};

function chequeLetterFallback(group: string) {
  const match = /^pd_cheques_([A-Z])$/.exec(group);
  if (!match) {
    return null;
  }
  return {
    prefix: `CH${match[1]}-`,
    suffix: '',
    next: '000001',
  };
}

/**
 * Auto increment orders service.
 */
@Injectable()
export class AutoIncrementOrdersService {
  constructor(
    @Inject(SETTINGS_PROVIDER)
    private readonly settingsStore: () => SettingsStore,
  ) {}

  /**
   * Check if the auto increment is enabled for the given settings group.
   * @param {string} settingsGroup - Settings group.
   * @returns {Promise<boolean>}
   */
  public autoIncrementEnabled = async (
    settingsGroup: string,
  ): Promise<boolean> => {
    const settingsStore = await this.settingsStore();
    const group = settingsGroup;

    // Settings service transaction number and prefix.
    return settingsStore.get({ group, key: 'auto_increment' }, false);
  };

  /**
   * Retrieve the next service transaction number.
   * @param {string} settingsGroup
   * @return {Promise<string>}
   */
  async getNextTransactionNumber(group: string): Promise<string> {
    const settingsStore = await this.settingsStore();

    const autoIncrement = await this.autoIncrementEnabled(group);

    const settingNo = settingsStore.get({ group, key: 'next_number' }, '');
    const settingPrefix = settingsStore.get(
      { group, key: 'number_prefix' },
      '',
    );
    const settingSuffix = settingsStore.get(
      { group, key: 'number_suffix' },
      '',
    );
    return autoIncrement ? `${settingPrefix}${settingNo}${settingSuffix || ''}` : '';
  }

  /**
   * Always-on peek of prefix + next + suffix (collection series).
   */
  async peekNumber(group: string): Promise<string> {
    const settingsStore = await this.settingsStore();
    const fallback =
      COLLECTION_FORMAT_FALLBACKS[group] || chequeLetterFallback(group);
    const settingNo = settingsStore.get(
      { group, key: 'next_number' },
      fallback?.next || '00001',
    );
    const settingPrefix = settingsStore.get(
      { group, key: 'number_prefix' },
      fallback?.prefix || '',
    );
    const settingSuffix = settingsStore.get(
      { group, key: 'number_suffix' },
      fallback?.suffix || '',
    );
    return `${settingPrefix}${settingNo}${settingSuffix || ''}`;
  }

  /**
   * Seed prefix/next if this collection series has never been used.
   */
  async ensureGroup(
    group: string,
    format: { prefix: string; suffix?: string; next: string },
  ): Promise<void> {
    const settingsStore = await this.settingsStore();
    const hasPrefix = settingsStore.get({ group, key: 'number_prefix' }, '');
    if (hasPrefix) {
      return;
    }
    settingsStore.set({ group, key: 'number_prefix' }, format.prefix);
    settingsStore.set({ group, key: 'number_suffix' }, format.suffix || '');
    settingsStore.set({ group, key: 'next_number' }, format.next);
    settingsStore.set({ group, key: 'auto_increment' }, true);
    await settingsStore.save();
  }

  /**
   * Always increment next_number for the group.
   */
  async bumpNumber(group: string): Promise<void> {
    const settingsStore = await this.settingsStore();
    const fallback =
      COLLECTION_FORMAT_FALLBACKS[group] || chequeLetterFallback(group);
    const settingNo = settingsStore.get(
      { group, key: 'next_number' },
      fallback?.next || '00001',
    );
    settingsStore.set(
      { group, key: 'next_number' },
      transactionIncrement(String(settingNo)),
    );
    await settingsStore.save();
  }

  /**
   * Increment setting next number.
   * @param {string} orderGroup - Order group.
   * @param {string} orderNumber -Order number.
   */
  async incrementSettingsNextNumber(group: string) {
    const settingsStore = await this.settingsStore();

    const settingNo = settingsStore.get({ group, key: 'next_number' });
    const autoIncrement = settingsStore.get({ group, key: 'auto_increment' });

    // // Can't continue if the auto-increment of the service was disabled.
    if (!autoIncrement) {
      return;
    }
    settingsStore.set(
      { group, key: 'next_number' },
      transactionIncrement(settingNo),
    );
    await settingsStore.save();
  }
}
