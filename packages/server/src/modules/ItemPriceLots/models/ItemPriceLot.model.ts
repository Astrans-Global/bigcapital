import { Model } from 'objection';
import { BaseModel } from '@/models/Model';

export class ItemPriceLot extends BaseModel {
  itemId!: number;
  warehouseId!: number;

  unitCostNet!: number;
  vatRatePercent!: number;

  originalQty!: number;
  realQty!: number;
  reservedQty!: number;

  userId!: number | null;

  createdAt!: Date;
  updatedAt!: Date | null;

  /**
   * Table name.
   */
  static get tableName() {
    return 'item_price_lots';
  }

  /**
   * Timestamps columns.
   */
  get timestamps() {
    return ['createdAt', 'updatedAt'];
  }

  /**
   * Virtual attributes.
   */
  static get virtualAttributes() {
    return ['floatQty'];
  }

  /**
   * Float quantity available for new reservations/invoicing.
   * See docs/ops/PHASE1.md: float_qty = real_qty - reserved_qty.
   * @returns {number}
   */
  get floatQty(): number {
    return this.realQty - this.reservedQty;
  }

  /**
   * Relationship mapping.
   */
  static get relationMappings() {
    const { Item } = require('../../Items/models/Item');
    const { Warehouse } = require('../../Warehouses/models/Warehouse.model');
    const {
      ItemPriceLotReceipt,
    } = require('./ItemPriceLotReceipt.model');

    return {
      /**
       * Price lot belongs to an item.
       */
      item: {
        relation: Model.BelongsToOneRelation,
        modelClass: Item,
        join: {
          from: 'item_price_lots.itemId',
          to: 'items.id',
        },
      },

      /**
       * Price lot belongs to a warehouse.
       */
      warehouse: {
        relation: Model.BelongsToOneRelation,
        modelClass: Warehouse,
        join: {
          from: 'item_price_lots.warehouseId',
          to: 'warehouses.id',
        },
      },

      /**
       * Price lot has many contributing GRN receipts (audit trail).
       */
      receipts: {
        relation: Model.HasManyRelation,
        modelClass: ItemPriceLotReceipt,
        join: {
          from: 'item_price_lots.id',
          to: 'item_price_lot_receipts.lotId',
        },
      },
    };
  }
}
