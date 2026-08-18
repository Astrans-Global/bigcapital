import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { SaleInvoice } from '../SaleInvoices/models/SaleInvoice';
import { ItemPriceLot } from '../ItemPriceLots/models/ItemPriceLot.model';
import { SaleInvoiceLinePnl } from './models/SaleInvoiceLinePnl.model';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { computeItemPriceLotUnitCosts } from '../ItemPriceLots/ComputeItemPriceLotCost';

const round4 = (value: number) =>
  Math.round((value + Number.EPSILON) * 10000) / 10000;
const round2 = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

/**
 * Snapshots the Secondary P&L inputs for every lot-picked line of a
 * Delivered sales invoice into `sale_invoice_line_pnls` -- see the creating
 * migration's header comment and docs/ops/PHASE1.md ("Secondary P&L").
 *
 * `sellNetPerUnit` reuses the exact same discount-allocation math as the
 * GRN item price-lot cost calculator (`computeItemPriceLotUnitCosts`), just
 * applied to the *sell* side (the invoice's own header discount, allocated
 * proportionally across lines) instead of the *buy* side -- this keeps the
 * "line discount + share of header discount, ex-VAT" definition identical
 * on both sides of the margin.
 */
@Injectable()
export class RecordSaleInvoiceLinePnlService {
  constructor(
    @Inject(SaleInvoice.name)
    private readonly saleInvoiceModel: TenantModelProxy<typeof SaleInvoice>,

    @Inject(ItemPriceLot.name)
    private readonly itemPriceLotModel: TenantModelProxy<typeof ItemPriceLot>,

    @Inject(SaleInvoiceLinePnl.name)
    private readonly linePnlModel: TenantModelProxy<typeof SaleInvoiceLinePnl>,
  ) {}

  /**
   * (Re-)computes and upserts the P&L snapshot rows for every lot-picked
   * line of the given Delivered invoice. Safe to call repeatedly -- always
   * replaces any prior rows for this invoice's lines rather than
   * accumulating. Lines with no lot picked are skipped (no cost basis).
   * @param {number} saleInvoiceId -
   * @param {Knex.Transaction} trx -
   */
  public async recordPnlForInvoice(
    saleInvoiceId: number,
    trx?: Knex.Transaction,
  ): Promise<void> {
    const invoice = await this.saleInvoiceModel()
      .query(trx)
      .findById(saleInvoiceId)
      .withGraphFetched('entries');

    if (!invoice || !invoice.entries?.length) {
      await this.clearPnlForInvoice(saleInvoiceId, trx);
      return;
    }

    const lotPickedEntries = invoice.entries.filter(
      (entry) => entry.itemPriceLotId,
    );
    if (!lotPickedEntries.length) {
      await this.clearPnlForInvoice(saleInvoiceId, trx);
      return;
    }

    const lotIds = [
      ...new Set(lotPickedEntries.map((entry) => entry.itemPriceLotId)),
    ];
    const lots = await this.itemPriceLotModel()
      .query(trx)
      .whereIn('id', lotIds as number[]);
    const lotById = new Map(lots.map((lot) => [lot.id, lot]));

    // Sell-side net-per-unit (ex-VAT, line discount + proportional header
    // discount share) for *every* entry, so the header discount is
    // allocated across the whole invoice the same way it would be on the
    // buy side -- not just across the lot-picked subset.
    const sellCosts = computeItemPriceLotUnitCosts(
      {
        discount: invoice.discount,
        discountType: invoice.discountType,
        entries: invoice.entries.map((entry) => ({
          quantity: entry.quantity,
          rate: entry.rate,
          discount: entry.discount,
          discountType: entry.discountType,
        })),
      },
      0, // VAT is irrelevant here -- we only want the ex-VAT net figure.
    );

    const rows: Partial<SaleInvoiceLinePnl>[] = [];

    invoice.entries.forEach((entry, index) => {
      if (!entry.itemPriceLotId) return;

      const lot = lotById.get(entry.itemPriceLotId);
      if (!lot) return;

      const { listPriceExclVat, discountPercent } = sellCosts[index];
      const sellNetPerUnit = listPriceExclVat * (1 - discountPercent / 100);
      const lotNetPerUnit =
        lot.listPriceExclVat * (1 - lot.discountPercent / 100);

      rows.push({
        saleInvoiceId: invoice.id,
        saleInvoiceEntryId: entry.id,
        itemPriceLotId: lot.id,
        quantity: entry.quantity,
        lotNetPerUnit: round4(lotNetPerUnit),
        sellNetPerUnit: round4(sellNetPerUnit),
        linePnl: round2(entry.quantity * (sellNetPerUnit - lotNetPerUnit)),
      });
    });

    // Replace-in-place: delete any prior rows for this invoice's entries,
    // then re-insert -- simpler and just as safe as diff-patching given
    // this only ever runs inside the invoice's own write transaction.
    await this.linePnlModel()
      .query(trx)
      .where('saleInvoiceId', saleInvoiceId)
      .delete();

    if (rows.length) {
      await this.linePnlModel().query(trx).insert(rows);
    }
  }

  /**
   * Removes all P&L snapshot rows for the given invoice -- used on invoice
   * delete, or if it's ever reverted out of Delivered / loses all its
   * lot-picked lines.
   * @param {number} saleInvoiceId -
   * @param {Knex.Transaction} trx -
   */
  public async clearPnlForInvoice(
    saleInvoiceId: number,
    trx?: Knex.Transaction,
  ): Promise<void> {
    await this.linePnlModel()
      .query(trx)
      .where('saleInvoiceId', saleInvoiceId)
      .delete();
  }
}
