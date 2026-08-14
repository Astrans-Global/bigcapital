import { Model } from 'objection';
import { BaseModel } from '@/models/Model';

/**
 * Audit trail row: how much quantity a specific GRN (Bill) line
 * contributed into a given item price-lot. A lot can be fed by more than
 * one bill once cost-matching merges are in play, so reverting or editing
 * a bill must be able to undo exactly its own contribution rather than
 * the lot's aggregate quantity.
 */
export class ItemPriceLotReceipt extends BaseModel {
  lotId!: number;
  sourceBillId!: number;
  sourceBillEntryId!: number | null;
  qty!: number;

  createdAt!: Date;
  updatedAt!: Date | null;

  /**
   * Table name.
   */
  static get tableName() {
    return 'item_price_lot_receipts';
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
    const { Bill } = require('../../Bills/models/Bill');
    const {
      ItemEntry,
    } = require('../../TransactionItemEntry/models/ItemEntry');

    return {
      lot: {
        relation: Model.BelongsToOneRelation,
        modelClass: ItemPriceLot,
        join: {
          from: 'item_price_lot_receipts.lotId',
          to: 'item_price_lots.id',
        },
      },

      sourceBill: {
        relation: Model.BelongsToOneRelation,
        modelClass: Bill,
        join: {
          from: 'item_price_lot_receipts.sourceBillId',
          to: 'bills.id',
        },
      },

      sourceBillEntry: {
        relation: Model.BelongsToOneRelation,
        modelClass: ItemEntry,
        join: {
          from: 'item_price_lot_receipts.sourceBillEntryId',
          to: 'items_entries.id',
        },
      },
    };
  }
}
