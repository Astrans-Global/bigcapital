import { Model } from 'objection';
import { BaseModel } from '@/models/Model';

/**
 * One row per (sale invoice line, item price-lot) pairing while that lot's
 * stock is held aside for the invoice -- Astrans DMS status pipeline
 * (Pending -> Reserved -> Invoiced -> Delivered), see the creating
 * migration's header comment and docs/ops/PHASE1.md ("Status pipeline").
 *
 * Exists only while the hold is active: rows are deleted if the invoice
 * drops back to Pending (releasing the hold) and `consumedAt` is stamped
 * (not deleted) once the invoice reaches Delivered, at which point the
 * hold has become a real, permanent stock decrease.
 */
export class ItemPriceLotReservation extends BaseModel {
  lotId!: number;
  sourceInvoiceId!: number;
  sourceInvoiceEntryId!: number | null;
  qty!: number;
  consumedAt!: Date | string | null;

  createdAt!: Date;
  updatedAt!: Date | null;

  /**
   * Table name.
   */
  static get tableName() {
    return 'item_price_lot_reservations';
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
    const { ItemPriceLot } = require('./ItemPriceLot.model');
    const { SaleInvoice } = require('../../SaleInvoices/models/SaleInvoice');

    return {
      /**
       * Reservation belongs to a lot.
       */
      lot: {
        relation: Model.BelongsToOneRelation,
        modelClass: ItemPriceLot,
        join: {
          from: 'item_price_lot_reservations.lotId',
          to: 'item_price_lots.id',
        },
      },

      /**
       * Reservation belongs to a sale invoice.
       */
      invoice: {
        relation: Model.BelongsToOneRelation,
        modelClass: SaleInvoice,
        join: {
          from: 'item_price_lot_reservations.sourceInvoiceId',
          to: 'sales_invoices.id',
        },
      },
    };
  }
}
