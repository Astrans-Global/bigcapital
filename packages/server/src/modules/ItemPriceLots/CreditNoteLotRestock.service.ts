import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { ItemEntry } from '@/modules/TransactionItemEntry/models/ItemEntry';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { ItemPriceLotStockService } from './ItemPriceLotStock.service';

/**
 * Puts returned quantity back onto the price lot the user picked on a
 * credit note. Only lines with `itemPriceLotId` participate; other lines
 * still move Bigcapital inventory the stock way.
 */
@Injectable()
export class CreditNoteLotRestockService {
  constructor(
    private readonly lotStock: ItemPriceLotStockService,

    @Inject(ItemEntry.name)
    private readonly itemEntryModel: TenantModelProxy<typeof ItemEntry>,
  ) {}

  public async restockForCreditNote(
    creditNoteId: number,
    trx?: Knex.Transaction,
  ): Promise<void> {
    const entries = await this.loadEntries(creditNoteId, trx);
    for (const [lotId, qty] of this.qtyByLot(entries)) {
      await this.lotStock.incrementRealQty(lotId, qty, trx);
    }
  }

  public async unreStockForCreditNote(
    creditNoteId: number,
    trx?: Knex.Transaction,
  ): Promise<void> {
    const entries = await this.loadEntries(creditNoteId, trx);
    for (const [lotId, qty] of this.qtyByLot(entries)) {
      await this.lotStock.decrementRealQty(lotId, qty, trx);
    }
  }

  private async loadEntries(creditNoteId: number, trx?: Knex.Transaction) {
    return this.itemEntryModel()
      .query(trx)
      .where('reference_type', 'CreditNote')
      .where('reference_id', creditNoteId);
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
