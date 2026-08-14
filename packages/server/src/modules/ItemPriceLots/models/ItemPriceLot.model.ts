import { Model } from 'objection';
import { BaseModel } from '@/models/Model';

export class ItemPriceLot extends BaseModel {
  itemId!: number;
  warehouseId!: number;

  // VAT-excluded, pre-discount unit list price from the originating GRN
  // line(s), and the effective combined discount % (line + proportional
  // header discount) relative to it. See the creating migration's header
  // comment for the full rationale -- these two are stored separately
  // (rather than one collapsed net cost) so both accounting (unitCostNet
  // below) and future invoice display can be derived from the same data.
  listPriceExclVat!: number;
  discountPercent!: number;
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
    return ['floatQty', 'unitCostNet'];
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
   * VAT-inclusive net cost per unit -- the "lot cost" used for COGS and
   * accounts-payable. Always derived from the stored list price/discount/
   * VAT snapshot rather than stored directly, so it can never drift out of
   * sync with them. See docs/ops/PHASE1.md ("Lots / GRN").
   * @returns {number}
   */
  get unitCostNet(): number {
    const netExVat =
      this.listPriceExclVat * (1 - this.discountPercent / 100);
    const grossed = netExVat * (1 + this.vatRatePercent / 100);

    return Math.round((grossed + Number.EPSILON) * 100) / 100;
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
