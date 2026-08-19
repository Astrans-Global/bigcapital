import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { WarehouseTransfer } from '@/modules/WarehousesTransfers/models/WarehouseTransfer';
import { ItemPriceLot } from './models/ItemPriceLot.model';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { ItemPriceLotStockService } from './ItemPriceLotStock.service';
import { ServiceError } from '@/modules/Items/ServiceError';
import { ERRORS } from './ItemPriceLots.constants';

/**
 * Moves quantity off the source price lot on Initiate, and onto a matching
 * (list, discount %, VAT %) lot at the destination warehouse on
 * Transferred. Reverses both on delete.
 */
@Injectable()
export class WarehouseTransferLotService {
  constructor(
    private readonly lotStock: ItemPriceLotStockService,

    @Inject(ItemPriceLot.name)
    private readonly itemPriceLotModel: TenantModelProxy<typeof ItemPriceLot>,
  ) {}

  public async applyInitiated(
    transfer: WarehouseTransfer,
    trx?: Knex.Transaction,
  ): Promise<void> {
    for (const entry of transfer.entries ?? []) {
      const lotId = entry.itemPriceLotId;
      if (!lotId) {
        throw new ServiceError(
          ERRORS.ITEM_PRICE_LOT_REQUIRED,
          `Warehouse transfer line for item #${entry.itemId} must pick a price lot.`,
        );
      }
      await this.assertLotMatchesWarehouse(
        lotId,
        transfer.fromWarehouseId,
        trx,
      );
      await this.lotStock.decrementRealQty(lotId, entry.quantity, trx);
    }
  }

  public async applyTransferred(
    transfer: WarehouseTransfer,
    trx?: Knex.Transaction,
  ): Promise<void> {
    for (const entry of transfer.entries ?? []) {
      if (!entry.itemPriceLotId) continue;
      const sourceLot = await this.itemPriceLotModel()
        .query(trx)
        .findById(entry.itemPriceLotId)
        .throwIfNotFound();
      await this.lotStock.mergeQtyIntoWarehouseLot(
        sourceLot,
        transfer.toWarehouseId,
        entry.quantity,
        trx,
      );
    }
  }

  public async revert(
    transfer: WarehouseTransfer,
    trx?: Knex.Transaction,
  ): Promise<void> {
    if (transfer.transferDeliveredAt) {
      for (const entry of transfer.entries ?? []) {
        if (!entry.itemPriceLotId) continue;
        const sourceLot = await this.itemPriceLotModel()
          .query(trx)
          .findById(entry.itemPriceLotId)
          .throwIfNotFound();
        const destLot = await this.itemPriceLotModel()
          .query(trx)
          .where('itemId', sourceLot.itemId)
          .where('warehouseId', transfer.toWarehouseId)
          .where('listPriceExclVat', sourceLot.listPriceExclVat)
          .where('discountPercent', sourceLot.discountPercent)
          .where('vatRatePercent', sourceLot.vatRatePercent)
          .first();
        if (destLot) {
          await this.lotStock.decrementRealQty(
            destLot.id,
            entry.quantity,
            trx,
          );
          await this.itemPriceLotModel()
            .query(trx)
            .where('id', destLot.id)
            .decrement('originalQty', entry.quantity);
        }
      }
    }

    if (transfer.transferInitiatedAt) {
      for (const entry of transfer.entries ?? []) {
        if (!entry.itemPriceLotId) continue;
        await this.lotStock.incrementRealQty(
          entry.itemPriceLotId,
          entry.quantity,
          trx,
        );
      }
    }
  }

  private async assertLotMatchesWarehouse(
    lotId: number,
    warehouseId: number,
    trx?: Knex.Transaction,
  ) {
    const lot = await this.itemPriceLotModel()
      .query(trx)
      .findById(lotId)
      .throwIfNotFound();
    if (lot.warehouseId !== warehouseId) {
      throw new ServiceError(
        ERRORS.ITEM_PRICE_LOT_WAREHOUSE_MISMATCH,
        `Item price-lot #${lotId} does not belong to warehouse #${warehouseId}.`,
      );
    }
  }
}
