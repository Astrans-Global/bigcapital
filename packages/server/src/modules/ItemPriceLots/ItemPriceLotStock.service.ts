import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { ItemPriceLot } from './models/ItemPriceLot.model';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { ServiceError } from '@/modules/Items/ServiceError';
import { ERRORS } from './ItemPriceLots.constants';

/**
 * Shared item-price-lot quantity moves used by cash receipts, credit notes,
 * and warehouse transfers. Invoice holds still go through
 * InvoiceLotReservationService (reserve / consume).
 */
@Injectable()
export class ItemPriceLotStockService {
  constructor(
    @Inject(ItemPriceLot.name)
    private readonly itemPriceLotModel: TenantModelProxy<typeof ItemPriceLot>,
  ) {}

  public async decrementRealQty(
    lotId: number,
    qty: number,
    trx?: Knex.Transaction,
  ): Promise<void> {
    if (!qty) return;

    const lot = await this.itemPriceLotModel()
      .query(trx)
      .findById(lotId)
      .throwIfNotFound();

    const floatQty = lot.realQty - lot.reservedQty;
    if (qty > floatQty) {
      throw new ServiceError(
        ERRORS.ITEM_PRICE_LOT_INSUFFICIENT_STOCK,
        `Item price-lot #${lotId} only has ${floatQty} available, ` +
          `but ${qty} was requested.`,
        { lotId, floatQty, requestedQty: qty },
      );
    }

    await this.itemPriceLotModel()
      .query(trx)
      .where('id', lotId)
      .decrement('realQty', qty);
  }

  public async incrementRealQty(
    lotId: number,
    qty: number,
    trx?: Knex.Transaction,
  ): Promise<void> {
    if (!qty) return;

    await this.itemPriceLotModel()
      .query(trx)
      .findById(lotId)
      .throwIfNotFound();

    await this.itemPriceLotModel()
      .query(trx)
      .where('id', lotId)
      .increment('realQty', qty);
  }

  /**
   * Finds the destination warehouse's lot with the same (list, discount %,
   * VAT %) triple as `sourceLot`, or creates it. Adds `qty` to that lot.
   */
  public async mergeQtyIntoWarehouseLot(
    sourceLot: ItemPriceLot,
    destWarehouseId: number,
    qty: number,
    trx?: Knex.Transaction,
  ): Promise<ItemPriceLot> {
    if (!qty) return sourceLot;

    const existing = await this.itemPriceLotModel()
      .query(trx)
      .where('itemId', sourceLot.itemId)
      .where('warehouseId', destWarehouseId)
      .where('listPriceExclVat', sourceLot.listPriceExclVat)
      .where('discountPercent', sourceLot.discountPercent)
      .where('vatRatePercent', sourceLot.vatRatePercent)
      .first();

    if (existing) {
      await this.itemPriceLotModel()
        .query(trx)
        .where('id', existing.id)
        .increment('originalQty', qty)
        .increment('realQty', qty);
      return existing;
    }

    return this.itemPriceLotModel()
      .query(trx)
      .insertAndFetch({
        itemId: sourceLot.itemId,
        warehouseId: destWarehouseId,
        listPriceExclVat: sourceLot.listPriceExclVat,
        discountPercent: sourceLot.discountPercent,
        vatRatePercent: sourceLot.vatRatePercent,
        originalQty: qty,
        realQty: qty,
        reservedQty: 0,
        userId: sourceLot.userId ?? null,
      } as Partial<ItemPriceLot>);
  }
}
