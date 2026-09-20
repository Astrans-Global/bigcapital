import { Model } from 'objection';
import { BaseModel } from '@/models/Model';

export class PdChequeEntry extends BaseModel {
  pdChequeId: number;
  invoiceId: number;
  paymentAmount: number;
  index: number;
  invoice?: any;

  static get tableName() {
    return 'pd_cheque_entries';
  }

  get timestamps() {
    return [];
  }

  static get relationMappings() {
    const { PdCheque } = require('./PdCheque.model');
    const { SaleInvoice } = require('../../SaleInvoices/models/SaleInvoice');

    return {
      cheque: {
        relation: Model.BelongsToOneRelation,
        modelClass: PdCheque,
        join: {
          from: 'pd_cheque_entries.pdChequeId',
          to: 'pd_cheques.id',
        },
      },
      invoice: {
        relation: Model.BelongsToOneRelation,
        modelClass: SaleInvoice,
        join: {
          from: 'pd_cheque_entries.invoiceId',
          to: 'sales_invoices.id',
        },
      },
    };
  }
}
