import { Model } from 'objection';
import { BaseModel } from '@/models/Model';

/**
 * One row per Delivered sales invoice, snapshotting the (output) VAT it
 * carried. See the creating migration's header comment for the full
 * rationale. Purpose-built read model for the future VAT (Sri Lanka 1B)
 * module -- see docs/ops/PHASE1.md ("VAT").
 */
export class SaleInvoiceVatRecord extends BaseModel {
  saleInvoiceId!: number;
  invoiceNo!: string | null;
  invoiceDate!: Date | string | null;
  customerId!: number;

  isVatCustomer!: boolean;

  vatRatePercent!: number;
  taxableAmount!: number;
  vatAmount!: number;

  createdAt!: Date;
  updatedAt!: Date | null;

  /**
   * Table name.
   */
  static get tableName() {
    return 'sale_invoice_vat_records';
  }

  /**
   * Timestamps columns.
   */
  get timestamps() {
    return ['createdAt', 'updatedAt'];
  }

  /**
   * Relationship mapping.
   */
  static get relationMappings() {
    const { SaleInvoice } = require('../../SaleInvoices/models/SaleInvoice');
    const { Customer } = require('../../Customers/models/Customer');

    return {
      /**
       * VAT record belongs to a sale invoice.
       */
      saleInvoice: {
        relation: Model.BelongsToOneRelation,
        modelClass: SaleInvoice,
        join: {
          from: 'sale_invoice_vat_records.saleInvoiceId',
          to: 'sales_invoices.id',
        },
      },

      /**
       * VAT record belongs to a customer (Bigcapital stores customers in
       * the shared, polymorphic `contacts` table).
       */
      customer: {
        relation: Model.BelongsToOneRelation,
        modelClass: Customer,
        join: {
          from: 'sale_invoice_vat_records.customerId',
          to: 'contacts.id',
        },
      },
    };
  }
}
