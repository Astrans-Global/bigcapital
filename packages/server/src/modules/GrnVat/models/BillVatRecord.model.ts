import { Model } from 'objection';
import { BaseModel } from '@/models/Model';

/**
 * One row per opened Bill (GRN), snapshotting the VAT it carried. See the
 * creating migration's header comment for the full rationale. Purpose-built
 * read model for the future VAT (Sri Lanka 1B) module -- see
 * docs/ops/PHASE1.md ("VAT").
 */
export class BillVatRecord extends BaseModel {
  billId!: number;
  billNumber!: string | null;
  billDate!: Date | string;
  vendorId!: number;

  vatRatePercent!: number;
  taxableAmount!: number;
  vatAmount!: number;

  createdAt!: Date;
  updatedAt!: Date | null;

  /**
   * Table name.
   */
  static get tableName() {
    return 'bill_vat_records';
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
    const { Bill } = require('../../Bills/models/Bill');
    const { Vendor } = require('../../Vendors/models/Vendor');

    return {
      /**
       * VAT record belongs to a bill.
       */
      bill: {
        relation: Model.BelongsToOneRelation,
        modelClass: Bill,
        join: {
          from: 'bill_vat_records.billId',
          to: 'bills.id',
        },
      },

      /**
       * VAT record belongs to a vendor (Bigcapital stores vendors in the
       * shared, polymorphic `contacts` table -- see `Vendor.tableName`).
       */
      vendor: {
        relation: Model.BelongsToOneRelation,
        modelClass: Vendor,
        join: {
          from: 'bill_vat_records.vendorId',
          to: 'contacts.id',
        },
      },
    };
  }
}
