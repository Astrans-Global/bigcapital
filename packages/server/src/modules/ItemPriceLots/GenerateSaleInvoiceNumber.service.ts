import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import * as moment from 'moment';
import { SaleInvoice } from '../SaleInvoices/models/SaleInvoice';
import { Customer } from '../Customers/models/Customer';
import { CustomerArea } from '../CustomerAreas/models/CustomerArea.model';
import { ServiceError } from '@/modules/Items/ServiceError';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { ERRORS } from './ItemPriceLots.constants';

/**
 * Assigns/burns the per-area DMS invoice number
 * (`YYMMM_ASTRANS{QQ}_{XXXXX}`) -- see docs/ops/PHASE1.md
 * ("Invoice numbers"). Bigcapital's own auto-increment numbering
 * (`sales_invoices` settings group) is no longer used for new invoices;
 * `invoice_no` stays empty through Pending/Reserved and only gets a real
 * value here, at Invoiced (or Delivered, if Invoiced was skipped).
 */
@Injectable()
export class GenerateSaleInvoiceNumberService {
  constructor(
    @Inject(SaleInvoice.name)
    private readonly saleInvoiceModel: TenantModelProxy<typeof SaleInvoice>,

    @Inject(Customer.name)
    private readonly customerModel: TenantModelProxy<typeof Customer>,

    @Inject(CustomerArea.name)
    private readonly customerAreaModel: TenantModelProxy<typeof CustomerArea>,
  ) {}

  /**
   * Assigns a fresh number to the invoice if it doesn't already have one.
   * No-ops for an invoice that already carries a number (e.g. it reached
   * Invoiced already and is now moving straight on to Delivered) -- the
   * same number is reused, never regenerated.
   *
   * The `YYMMM` part always reflects *today* (the date this number is
   * actually generated), not whatever Invoice Date is later fixed at the
   * Delivered step -- matches the original spec's "current year/month"
   * wording.
   *
   * Must be called inside the same transaction as the status-change patch,
   * since bumping the area's sequence and stamping the invoice have to
   * commit or roll back together.
   * @param {number} invoiceId - Sale invoice id.
   * @param {Knex.Transaction} trx -
   */
  public async assignNumberIfMissing(
    invoiceId: number,
    trx: Knex.Transaction,
  ): Promise<void> {
    const invoice = await this.saleInvoiceModel()
      .query(trx)
      .findById(invoiceId);

    if (!invoice || invoice.invoiceNo) return;

    const customer = await this.customerModel()
      .query(trx)
      .findById(invoice.customerId);

    if (!customer?.areaId) {
      throw new ServiceError(
        ERRORS.CUSTOMER_HAS_NO_AREA,
        'This invoice\'s customer has no Area assigned, so an invoice number cannot be generated. Please set an Area on the customer first.',
      );
    }
    // Row-locked so two invoices for the same area can't race for the
    // same sequence number.
    const area = await this.customerAreaModel()
      .query(trx)
      .findById(customer.areaId)
      .forUpdate();

    if (!area) {
      throw new ServiceError(
        ERRORS.AREA_NOT_FOUND,
        'The customer\'s Area was not found.',
      );
    }
    if (!area.invoiceNumberCode) {
      throw new ServiceError(
        ERRORS.AREA_MISSING_INVOICE_CODE,
        'The customer\'s Area does not have an area code set up yet, so an invoice number cannot be generated. Please set one on the Area first.',
      );
    }
    const sequence = area.nextInvoiceNumber || 10001;
    const now = moment();
    const invoiceNo = `${now.format('YY')}${now
      .format('MMM')
      .toUpperCase()}_ASTRANS${area.invoiceNumberCode}_${sequence}`;

    await this.customerAreaModel()
      .query(trx)
      .findById(area.id)
      .patch({ nextInvoiceNumber: sequence + 1 } as any);

    await this.saleInvoiceModel()
      .query(trx)
      .where('id', invoiceId)
      .patch({ invoiceNo } as any);
  }

  /**
   * Clears ("burns") the invoice's DMS-assigned number when it's reverted
   * out of Invoiced back to Pending/Reserved. The area's sequence never
   * rewinds, so that number is now permanently skipped -- the invoice
   * gets a brand new one the next time it reaches Invoiced/Delivered.
   * @param {number} invoiceId - Sale invoice id.
   * @param {Knex.Transaction} trx -
   */
  public async burnNumber(
    invoiceId: number,
    trx: Knex.Transaction,
  ): Promise<void> {
    await this.saleInvoiceModel()
      .query(trx)
      .where('id', invoiceId)
      .patch({ invoiceNo: null } as any);
  }
}
