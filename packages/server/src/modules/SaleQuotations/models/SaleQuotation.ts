import { Model } from 'objection';
import { defaultTo } from 'lodash';
import { TenantBaseModel } from '@/modules/System/models/TenantBaseModel';
import { DiscountType } from '@/common/types/Discount';
import { ItemEntry } from '@/modules/TransactionItemEntry/models/ItemEntry';
import { Warehouse } from '@/modules/Warehouses/models/Warehouse.model';

/**
 * Price-list quotation for a prospect. Not a customer document, not an
 * estimate, never converts to an invoice, never posts GL or stock.
 */
export class SaleQuotation extends TenantBaseModel {
  quotationNumber!: string;
  quotationDate!: Date | string;
  companyName!: string;
  addressTo?: string;
  addressLine1?: string;
  addressLine2?: string;
  currencyCode!: string;
  exchangeRate!: number;
  amount!: number;
  discount!: number;
  discountType!: DiscountType;
  adjustment!: number;
  taxAmountWithheld!: number;
  warehouseId?: number;
  branchId?: number;
  userId?: number;
  createdAt?: Date;
  updatedAt?: Date | null;

  public entries!: ItemEntry[];
  public warehouse?: Warehouse;

  static get tableName() {
    return 'sales_quotations';
  }

  get timestamps() {
    return ['createdAt', 'updatedAt'];
  }

  static get virtualAttributes() {
    return ['subtotal', 'discountAmount', 'total'];
  }

  get subtotal() {
    return this.amount;
  }

  get discountAmount() {
    return 0;
  }

  get total() {
    const taxAmount = defaultTo(this.taxAmountWithheld, 0);
    return this.subtotal + taxAmount;
  }

  static get relationMappings() {
    const {
      ItemEntry,
    } = require('../../TransactionItemEntry/models/ItemEntry');
    const { Warehouse } = require('../../Warehouses/models/Warehouse.model');
    const { Branch } = require('../../Branches/models/Branch.model');

    return {
      entries: {
        relation: Model.HasManyRelation,
        modelClass: ItemEntry,
        join: {
          from: 'sales_quotations.id',
          to: 'items_entries.referenceId',
        },
        filter(builder) {
          builder.where('reference_type', 'SaleQuotation');
          builder.orderBy('index', 'ASC');
        },
      },
      warehouse: {
        relation: Model.BelongsToOneRelation,
        modelClass: Warehouse,
        join: {
          from: 'sales_quotations.warehouseId',
          to: 'warehouses.id',
        },
      },
      branch: {
        relation: Model.BelongsToOneRelation,
        modelClass: Branch,
        join: {
          from: 'sales_quotations.branchId',
          to: 'branches.id',
        },
      },
    };
  }
}
