import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { Bill } from '../Bills/models/Bill';
import { BillVatRecord } from './models/BillVatRecord.model';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { SETTINGS_PROVIDER } from '../Settings/Settings.types';
import { SettingsStore } from '../Settings/SettingsStore';
import { computeItemPriceLotUnitCosts } from '../ItemPriceLots/ComputeItemPriceLotCost';

// See docs/ops/PHASE1.md: "Settings: VAT % (default 18)".
const DEFAULT_VAT_RATE_PERCENT_FALLBACK = 18;

const round2 = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

/**
 * Snapshots the VAT amount carried by a Bill (GRN) into `bill_vat_records`,
 * for the future VAT module -- see the creating migration's header comment
 * and docs/ops/PHASE1.md ("VAT").
 *
 * Unlike `RecordItemPriceLotsFromBillService` (which only concerns itself
 * with inventory lines, since that's what item price-lots track), this
 * covers *every* line of the bill -- input VAT for filing purposes must
 * include non-inventory purchases too.
 */
@Injectable()
export class RecordBillVatFromBillService {
  constructor(
    @Inject(Bill.name)
    private readonly billModel: TenantModelProxy<typeof Bill>,

    @Inject(BillVatRecord.name)
    private readonly billVatRecordModel: TenantModelProxy<
      typeof BillVatRecord
    >,

    @Inject(SETTINGS_PROVIDER)
    private readonly settingsStore: () => SettingsStore,
  ) {}

  /**
   * Reads the org-configured default VAT %, falling back to 18.
   */
  private async getDefaultVatRatePercent(): Promise<number> {
    const settings = await this.settingsStore();

    const value = settings.get(
      { group: 'astrans_ops', key: 'default_vat_rate_percent' },
      DEFAULT_VAT_RATE_PERCENT_FALLBACK,
    );
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : DEFAULT_VAT_RATE_PERCENT_FALLBACK;
  }

  /**
   * (Re-)computes and upserts the VAT record for the given bill. Safe to
   * call repeatedly (on both create and edit) -- always replaces any prior
   * record for this bill rather than accumulating.
   * @param {number} billId - Bill (GRN) id.
   * @param {Knex.Transaction} trx -
   */
  public async recordVatForBill(
    billId: number,
    trx?: Knex.Transaction,
  ): Promise<void> {
    const bill = await this.billModel()
      .query(trx)
      .findById(billId)
      .withGraphFetched('entries');

    if (!bill || !bill.entries?.length) return;

    const defaultVatRatePercent = await this.getDefaultVatRatePercent();

    // Same discount-allocation math as the item price-lot cost calculator
    // (single source of truth for "what VAT-inclusive amount did this GRN
    // actually cost"), applied across all lines -- not just inventory ones.
    const lotCosts = computeItemPriceLotUnitCosts(
      {
        discount: bill.discount,
        discountType: bill.discountType,
        entries: bill.entries.map((entry) => ({
          quantity: entry.quantity,
          rate: entry.rate,
          discount: entry.discount,
          discountType: entry.discountType,
        })),
      },
      defaultVatRatePercent,
    );

    let taxableAmount = 0;
    let vatAmount = 0;

    bill.entries.forEach((entry, index) => {
      const { listPriceExclVat, discountPercent, unitCostNet } = lotCosts[
        index
      ];
      const netExVatPerUnit = listPriceExclVat * (1 - discountPercent / 100);

      const lineNetTotal = entry.quantity * netExVatPerUnit;
      const lineGrossTotal = entry.quantity * unitCostNet;

      taxableAmount += lineNetTotal;
      vatAmount += lineGrossTotal - lineNetTotal;
    });

    const record = {
      billId: bill.id,
      billNumber: bill.billNumber ?? null,
      billDate: bill.billDate,
      vendorId: bill.vendorId,
      vatRatePercent: defaultVatRatePercent,
      taxableAmount: round2(taxableAmount),
      vatAmount: round2(vatAmount),
    } as Partial<BillVatRecord>;

    const existing = await this.billVatRecordModel()
      .query(trx)
      .where('billId', billId)
      .first();

    if (existing) {
      await this.billVatRecordModel()
        .query(trx)
        .where('id', existing.id)
        .patch(record);
    } else {
      await this.billVatRecordModel().query(trx).insert(record);
    }
  }

  /**
   * Removes the VAT record for the given bill -- used on bill delete.
   * @param {number} billId - Bill (GRN) id.
   * @param {Knex.Transaction} trx -
   */
  public async revertVatForBill(
    billId: number,
    trx?: Knex.Transaction,
  ): Promise<void> {
    await this.billVatRecordModel().query(trx).where('billId', billId).delete();
  }
}
