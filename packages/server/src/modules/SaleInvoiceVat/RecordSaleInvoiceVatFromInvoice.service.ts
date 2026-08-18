import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { SaleInvoice } from '../SaleInvoices/models/SaleInvoice';
import { Customer } from '../Customers/models/Customer';
import { SaleInvoiceVatRecord } from './models/SaleInvoiceVatRecord.model';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { SETTINGS_PROVIDER } from '../Settings/Settings.types';
import { SettingsStore } from '../Settings/SettingsStore';
import { computeSaleInvoiceVatAfterDiscount } from '../SaleInvoices/ComputeSaleInvoiceVat';

// See docs/ops/PHASE1.md: "Settings: VAT % (default 18)".
const DEFAULT_VAT_RATE_PERCENT_FALLBACK = 18;

/**
 * Snapshots the (output) VAT carried by a Delivered sales invoice into
 * `sale_invoice_vat_records` -- the output-VAT mirror of
 * `RecordBillVatFromBillService` (input VAT). See the creating migration's
 * header comment and docs/ops/PHASE1.md ("VAT").
 *
 * Every invoice is always calculated/posted as VAT-inclusive internally --
 * "Non-VAT invoice" is purely a print-time format choice (see
 * docs/ops/PHASE1.md). `isVatCustomer` just snapshots whether the customer
 * had a TIN at delivery time, for the future VAT module to know which
 * print format applied.
 */
@Injectable()
export class RecordSaleInvoiceVatFromInvoiceService {
  constructor(
    @Inject(SaleInvoice.name)
    private readonly saleInvoiceModel: TenantModelProxy<typeof SaleInvoice>,

    @Inject(Customer.name)
    private readonly customerModel: TenantModelProxy<typeof Customer>,

    @Inject(SaleInvoiceVatRecord.name)
    private readonly saleInvoiceVatRecordModel: TenantModelProxy<
      typeof SaleInvoiceVatRecord
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
   * (Re-)computes and upserts the VAT record for the given Delivered
   * invoice. Safe to call repeatedly -- always replaces any prior record
   * for this invoice rather than accumulating.
   * @param {number} saleInvoiceId -
   * @param {Knex.Transaction} trx -
   */
  public async recordVatForInvoice(
    saleInvoiceId: number,
    trx?: Knex.Transaction,
  ): Promise<void> {
    const invoice = await this.saleInvoiceModel()
      .query(trx)
      .findById(saleInvoiceId)
      .withGraphFetched('entries');

    if (!invoice || !invoice.entries?.length) return;

    const customer = await this.customerModel()
      .query(trx)
      .findById(invoice.customerId);

    const defaultVatRatePercent = await this.getDefaultVatRatePercent();
    const vatRatePercent =
      Number(invoice.entries.find((entry) => entry.taxRate)?.taxRate) ||
      defaultVatRatePercent;

    // Same after-header-discount VAT as the invoice form, GL, and statutory
    // Excel template -- see ComputeSaleInvoiceVat / docs/ops/PHASE1.md.
    const vatAfterDiscount = computeSaleInvoiceVatAfterDiscount({
      entries: invoice.entries,
      discount: invoice.discount,
      discountType: invoice.discountType,
      vatRatePercent,
    });

    const record = {
      saleInvoiceId: invoice.id,
      invoiceNo: invoice.invoiceNo ?? null,
      invoiceDate: invoice.invoiceDate ?? null,
      customerId: invoice.customerId,
      isVatCustomer: Boolean(customer?.tinNumber),
      vatRatePercent,
      taxableAmount: vatAfterDiscount.taxableAmount,
      vatAmount: vatAfterDiscount.vatAmount,
    } as Partial<SaleInvoiceVatRecord>;

    const existing = await this.saleInvoiceVatRecordModel()
      .query(trx)
      .where('saleInvoiceId', saleInvoiceId)
      .first();

    if (existing) {
      await this.saleInvoiceVatRecordModel()
        .query(trx)
        .where('id', existing.id)
        .patch(record);
    } else {
      await this.saleInvoiceVatRecordModel().query(trx).insert(record);
    }
  }

  /**
   * Removes the VAT record for the given invoice -- used on invoice
   * delete, or if it's ever reverted out of Delivered.
   * @param {number} saleInvoiceId -
   * @param {Knex.Transaction} trx -
   */
  public async revertVatForInvoice(
    saleInvoiceId: number,
    trx?: Knex.Transaction,
  ): Promise<void> {
    await this.saleInvoiceVatRecordModel()
      .query(trx)
      .where('saleInvoiceId', saleInvoiceId)
      .delete();
  }
}
