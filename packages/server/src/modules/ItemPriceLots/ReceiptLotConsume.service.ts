import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { ItemEntry } from '@/modules/TransactionItemEntry/models/ItemEntry';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { ItemPriceLotStockService } from './ItemPriceLotStock.service';

/**
 * Permanently decreases (or restores) item price-lot quantity for a closed
 * sale receipt. Cash sales skip the invoice Pending/Reserved/Invoiced
 * holds — stock leaves when the receipt is closed.
 */
@Injectable()
export class ReceiptLotConsumeService {
  constructor(
    private readonly lotStock: ItemPriceLotStockService,

    @Inject(ItemEntry.name)
    private readonly itemEntryModel: TenantModelProxy<typeof ItemEntry>,
  ) {}

  public async consumeForReceipt(
    receiptId: number,
    trx?: Knex.Transaction,
  ): Promise<void> {
    const entries = await this.loadEntries(receiptId, trx);
    for (const [lotId, qty] of this.qtyByLot(entries)) {
      await this.lotStock.decrementRealQty(lotId, qty, trx);
    }
  }

  public async restoreForReceipt(
    receiptId: number,
    trx?: Knex.Transaction,
  ): Promise<void> {
    const entries = await this.loadEntries(receiptId, trx);
    for (const [lotId, qty] of this.qtyByLot(entries)) {
      await this.lotStock.incrementRealQty(lotId, qty, trx);
    }
  }

  private async loadEntries(receiptId: number, trx?: Knex.Transaction) {
    return this.itemEntryModel()
      .query(trx)
      .where('reference_type', 'SaleReceipt')
      .where('reference_id', receiptId);
  }

  private qtyByLot(
    entries: Array<{ itemPriceLotId?: number | null; quantity?: number }>,
  ): Map<number, number> {
    const qtyByLotId = new Map<number, number>();
    for (const entry of entries ?? []) {
      if (!entry.itemPriceLotId) continue;
      qtyByLotId.set(
        entry.itemPriceLotId,
        (qtyByLotId.get(entry.itemPriceLotId) ?? 0) +
          (Number(entry.quantity) || 0),
      );
    }
    return qtyByLotId;
  }
}
