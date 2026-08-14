import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { Bill } from '../Bills/models/Bill';
import { ItemPriceLot } from './models/ItemPriceLot.model';
import { ItemPriceLotReceipt } from './models/ItemPriceLotReceipt.model';
import { ItemsEntriesService } from '../Items/ItemsEntries.service';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { SETTINGS_PROVIDER } from '../Settings/Settings.types';
import { SettingsStore } from '../Settings/SettingsStore';
import { computeItemPriceLotUnitCosts } from './ComputeItemPriceLotCost';

// See docs/ops/PHASE1.md: "Settings: VAT % (default 18)".
const DEFAULT_VAT_RATE_PERCENT_FALLBACK = 18;

@Injectable()
export class RecordItemPriceLotsFromBillService {
  constructor(
    private readonly itemsEntriesService: ItemsEntriesService,

    @Inject(Bill.name)
    private readonly billModel: TenantModelProxy<typeof Bill>,

    @Inject(ItemPriceLot.name)
    private readonly itemPriceLotModel: TenantModelProxy<typeof ItemPriceLot>,

    @Inject(ItemPriceLotReceipt.name)
    private readonly itemPriceLotReceiptModel: TenantModelProxy<
      typeof ItemPriceLotReceipt
    >,

    @Inject(SETTINGS_PROVIDER)
    private readonly settingsStore: () => SettingsStore,
  ) {}

  /**
   * Reads the org-configured default VAT %, falling back to 18.
   */
  private async getDefaultVatRatePercent(): Promise<number> {
    const settings = await this.settingsStore();

    // Stored value may come back as a string (settings are persisted as
    // text columns), so coerce rather than relying on typeof === 'number'.
    const value = settings.get(
      { group: 'astrans_ops', key: 'default_vat_rate_percent' },
      DEFAULT_VAT_RATE_PERCENT_FALLBACK,
    );
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : DEFAULT_VAT_RATE_PERCENT_FALLBACK;
  }

  /**
   * Records (or merges into existing) item price-lots for every inventory
   * line of the given bill (GRN). Safe to call more than once for the same
   * bill: lines already recorded (by bill entry id) are skipped unless
   * `override` is set, in which case this bill's prior contribution is
   * reverted and re-applied from scratch -- mirrors Bigcapital's own
   * inventory-transactions override semantics used on bill edit.
   * @param {number} billId - Bill (GRN) id.
   * @param {boolean} override - Recompute from scratch (used on bill edit).
   * @param {Knex.Transaction} trx -
   */
  public async recordLotsForBill(
    billId: number,
    override = false,
    trx?: Knex.Transaction,
  ): Promise<void> {
    if (override) {
      await this.revertLotsForBill(billId, trx);
    }
    const bill = await this.billModel()
      .query(trx)
      .findById(billId)
      .withGraphFetched('entries');

    if (!bill) return;

    const inventoryEntries = await this.itemsEntriesService.filterInventoryEntries(
      bill.entries ?? [],
      trx,
    );
    if (inventoryEntries.length === 0) return;

    const defaultVatRatePercent = await this.getDefaultVatRatePercent();

    const lotCosts = computeItemPriceLotUnitCosts(
      {
        discount: bill.discount,
        discountType: bill.discountType,
        entries: inventoryEntries.map((entry) => ({
          quantity: entry.quantity,
          rate: entry.rate,
          discount: entry.discount,
          discountType: entry.discountType,
        })),
      },
      defaultVatRatePercent,
    );

    for (let i = 0; i < inventoryEntries.length; i++) {
      const entry = inventoryEntries[i];
      const { listPriceExclVat, discountPercent, vatRatePercent } = lotCosts[i];

      // Idempotency: skip if this exact bill line was already recorded.
      const existingReceipt = await this.itemPriceLotReceiptModel()
        .query(trx)
        .where('sourceBillId', billId)
        .where('sourceBillEntryId', entry.id)
        .first();
      if (existingReceipt) continue;

      const warehouseId = entry.warehouseId || bill.warehouseId;
      if (!warehouseId) {
        throw new Error(
          `Cannot record an item price-lot for bill #${billId}: no warehouse ` +
            `set on the bill or its line for item #${entry.itemId}.`,
        );
      }

      // A lot's identity is its (price, discount, VAT) triple -- the same
      // GRN terms mean the same lot, regardless of how many bills fed it.
      const existingLot = await this.itemPriceLotModel()
        .query(trx)
        .where('itemId', entry.itemId)
        .where('warehouseId', warehouseId)
        .where('listPriceExclVat', listPriceExclVat)
        .where('discountPercent', discountPercent)
        .where('vatRatePercent', vatRatePercent)
        .first();

      let lotId: number;

      if (existingLot) {
        lotId = existingLot.id;

        await this.itemPriceLotModel()
          .query(trx)
          .where('id', lotId)
          .increment('originalQty', entry.quantity)
          .increment('realQty', entry.quantity);
      } else {
        const newLot = await this.itemPriceLotModel()
          .query(trx)
          .insertAndFetch({
            itemId: entry.itemId,
            warehouseId,
            listPriceExclVat,
            discountPercent,
            vatRatePercent,
            originalQty: entry.quantity,
            realQty: entry.quantity,
            reservedQty: 0,
            userId: bill.userId ?? null,
          } as Partial<ItemPriceLot>);
        lotId = newLot.id;
      }

      await this.itemPriceLotReceiptModel()
        .query(trx)
        .insert({
          lotId,
          sourceBillId: billId,
          sourceBillEntryId: entry.id,
          qty: entry.quantity,
        } as Partial<ItemPriceLotReceipt>);
    }
  }

  /**
   * Reverts all item price-lot receipts previously recorded for the given
   * bill -- used before re-recording on edit, and on bill delete. Throws
   * if any affected lot's float quantity (real - reserved) would go
   * negative, which means stock this GRN brought in has already been
   * reserved or delivered against a sales invoice and the bill cannot be
   * safely edited/deleted.
   * @param {number} billId - Bill (GRN) id.
   * @param {Knex.Transaction} trx -
   */
  public async revertLotsForBill(
    billId: number,
    trx?: Knex.Transaction,
  ): Promise<void> {
    const receipts = await this.itemPriceLotReceiptModel()
      .query(trx)
      .where('sourceBillId', billId);

    if (receipts.length === 0) return;

    const qtyByLotId = new Map<number, number>();
    for (const receipt of receipts) {
      qtyByLotId.set(
        receipt.lotId,
        (qtyByLotId.get(receipt.lotId) ?? 0) + receipt.qty,
      );
    }

    for (const [lotId, qtyToRevert] of qtyByLotId.entries()) {
      const lot = await this.itemPriceLotModel()
        .query(trx)
        .findById(lotId)
        .throwIfNotFound();

      const newRealQty = lot.realQty - qtyToRevert;

      if (newRealQty < lot.reservedQty) {
        throw new Error(
          `Cannot edit or delete bill #${billId}: stock it received into ` +
            `item price-lot #${lotId} has already been reserved or ` +
            `delivered against a sales invoice.`,
        );
      }

      await this.itemPriceLotModel()
        .query(trx)
        .where('id', lotId)
        .patch({
          originalQty: Math.max(lot.originalQty - qtyToRevert, 0),
          realQty: newRealQty,
        });
    }

    await this.itemPriceLotReceiptModel()
      .query(trx)
      .where('sourceBillId', billId)
      .delete();
  }
}
