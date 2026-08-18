import { Model } from 'objection';
import { BaseModel } from '@/models/Model';

/**
 * One row per Delivered invoice line sold from a picked item price-lot,
 * snapshotting the Secondary P&L inputs for that line. See the creating
 * migration's header comment and docs/ops/PHASE1.md ("Secondary P&L").
 */
export class SaleInvoiceLinePnl extends BaseModel {
  saleInvoiceId!: number;
  saleInvoiceEntryId!: number;
  itemPriceLotId!: number;

  quantity!: number;
  lotNetPerUnit!: number;
  sellNetPerUnit!: number;
  linePnl!: number;

  createdAt!: Date;
  updatedAt!: Date | null;

  /**
   * Table name.
   */
  static get tableName() {
    return 'sale_invoice_line_pnls';
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
    const { ItemEntry } = require('../../TransactionItemEntry/models/ItemEntry');
    const { ItemPriceLot } = require('../../ItemPriceLots/models/ItemPriceLot.model');

    return {
      /**
       * P&L line belongs to a sale invoice.
       */
      saleInvoice: {
        relation: Model.BelongsToOneRelation,
        modelClass: SaleInvoice,
        join: {
          from: 'sale_invoice_line_pnls.saleInvoiceId',
          to: 'sales_invoices.id',
        },
      },

      /**
       * P&L line belongs to an invoice line (items_entries).
       */
      saleInvoiceEntry: {
        relation: Model.BelongsToOneRelation,
        modelClass: ItemEntry,
        join: {
          from: 'sale_invoice_line_pnls.saleInvoiceEntryId',
          to: 'items_entries.id',
        },
      },

      /**
       * P&L line was sold from this item price-lot.
       */
      itemPriceLot: {
        relation: Model.BelongsToOneRelation,
        modelClass: ItemPriceLot,
        join: {
          from: 'sale_invoice_line_pnls.itemPriceLotId',
          to: 'item_price_lots.id',
        },
      },
    };
  }
}
