import { Model } from 'objection';
import { TenantBaseModel } from '@/modules/System/models/TenantBaseModel';

export class PdCheque extends TenantBaseModel {
  customerId: number;
  chequeNo: string;
  documentNo: string;
  amount: number;
  allocatedAmount: number;
  advanceAmount: number;
  collectedDate: string;
  bankingDate: string;
  status: string;
  depositedBankId?: number;
  realizedBankId?: number;
  realizedAt?: string;
  returnedAt?: string;
  currencyCode: string;
  exchangeRate: number;
  branchId?: number;
  userId?: number;
  referenceNo?: string;
  statement?: string;
  chequesAccountId?: number;
  advancesAccountId?: number;
  createdAt?: string;
  updatedAt?: string;
  entries?: any[];
  customer?: any;

  static get tableName() {
    return 'pd_cheques';
  }

  get timestamps() {
    return ['createdAt', 'updatedAt'];
  }

  get localAmount() {
    return Number(this.amount) * Number(this.exchangeRate || 1);
  }

  get localAllocated() {
    return Number(this.allocatedAmount) * Number(this.exchangeRate || 1);
  }

  get localAdvance() {
    return Number(this.advanceAmount) * Number(this.exchangeRate || 1);
  }

  static get relationMappings() {
    const { PdChequeEntry } = require('./PdChequeEntry.model');
    const { Customer } = require('../../Customers/models/Customer');
    const { Account } = require('../../Accounts/models/Account.model');

    return {
      customer: {
        relation: Model.BelongsToOneRelation,
        modelClass: Customer,
        join: {
          from: 'pd_cheques.customerId',
          to: 'contacts.id',
        },
        filter: (query) => {
          query.where('contact_service', 'customer');
        },
      },
      entries: {
        relation: Model.HasManyRelation,
        modelClass: PdChequeEntry,
        join: {
          from: 'pd_cheques.id',
          to: 'pd_cheque_entries.pdChequeId',
        },
        filter: (query) => {
          query.orderBy('index', 'ASC');
        },
      },
      depositedBank: {
        relation: Model.BelongsToOneRelation,
        modelClass: Account,
        join: {
          from: 'pd_cheques.depositedBankId',
          to: 'accounts.id',
        },
      },
      realizedBank: {
        relation: Model.BelongsToOneRelation,
        modelClass: Account,
        join: {
          from: 'pd_cheques.realizedBankId',
          to: 'accounts.id',
        },
      },
    };
  }
}
