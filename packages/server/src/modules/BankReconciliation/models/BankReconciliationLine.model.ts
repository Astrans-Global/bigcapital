import { Model } from 'objection';
import { TenantBaseModel } from '@/modules/System/models/TenantBaseModel';

export class BankReconciliationLine extends TenantBaseModel {
  reconciliationId: number;
  accountTransactionId: number;
  ticked: boolean;
  transaction?: any;

  static get tableName() {
    return 'bank_reconciliation_lines';
  }

  get timestamps() {
    return [];
  }

  static get relationMappings() {
    const { BankReconciliation } = require('./BankReconciliation.model');
    const {
      AccountTransaction,
    } = require('../../Accounts/models/AccountTransaction.model');

    return {
      reconciliation: {
        relation: Model.BelongsToOneRelation,
        modelClass: BankReconciliation,
        join: {
          from: 'bank_reconciliation_lines.reconciliationId',
          to: 'bank_reconciliations.id',
        },
      },
      transaction: {
        relation: Model.BelongsToOneRelation,
        modelClass: AccountTransaction,
        join: {
          from: 'bank_reconciliation_lines.accountTransactionId',
          to: 'accounts_transactions.id',
        },
      },
    };
  }
}
