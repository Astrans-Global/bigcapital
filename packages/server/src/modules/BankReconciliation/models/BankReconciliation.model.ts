import { Model } from 'objection';
import { TenantBaseModel } from '@/modules/System/models/TenantBaseModel';

export class BankReconciliation extends TenantBaseModel {
  accountId: number;
  periodMonth: string;
  startDate: string;
  endDate: string;
  beginningBalance: number;
  endingBalance: number;
  status: string;
  closedAt?: string;
  reopenedAt?: string;
  createdBy?: number;
  closedBy?: number;
  createdAt?: string;
  updatedAt?: string;
  lines?: any[];
  account?: any;

  static get tableName() {
    return 'bank_reconciliations';
  }

  get timestamps() {
    return ['createdAt', 'updatedAt'];
  }

  static get relationMappings() {
    const { BankReconciliationLine } = require('./BankReconciliationLine.model');
    const { Account } = require('../../Accounts/models/Account.model');

    return {
      lines: {
        relation: Model.HasManyRelation,
        modelClass: BankReconciliationLine,
        join: {
          from: 'bank_reconciliations.id',
          to: 'bank_reconciliation_lines.reconciliationId',
        },
      },
      account: {
        relation: Model.BelongsToOneRelation,
        modelClass: Account,
        join: {
          from: 'bank_reconciliations.accountId',
          to: 'accounts.id',
        },
      },
    };
  }
}
