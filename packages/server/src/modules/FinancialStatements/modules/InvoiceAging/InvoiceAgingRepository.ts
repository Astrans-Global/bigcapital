import { Inject, Injectable } from '@nestjs/common';
import { SaleInvoice } from '@/modules/SaleInvoices/models/SaleInvoice';
import { PaymentReceivedEntry } from '@/modules/PaymentReceived/models/PaymentReceivedEntry';
import { PdChequeEntry } from '@/modules/PdCheques/models/PdChequeEntry.model';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { PAYMENT_METHODS } from '@/modules/PaymentReceived/payment-methods';
import { PD_CHEQUE_STATUS } from '@/modules/PdCheques/constants';
import {
  bucketKeyForDays,
  daysBetween,
  emptyBuckets,
  OUTSTANDING_AGING_BUCKETS,
} from './agingBuckets';
import { InvoiceAgingQueryDto } from './InvoiceAgingQuery.dto';
import * as moment from 'moment';

export interface InvoiceAgingComputedRow {
  customerName: string;
  routeCity: string;
  invoiceDate: string;
  invoiceNo: string;
  invoiceAmount: number;
  dueAmount: number;
  daysDue: number;
  buckets: Record<string, number>;
  totalOutstanding: number;
  unrealized: number;
  balance: number;
  realized: number;
  pendingCheque: number;
  undepositedCash: number;
  actualDue: number;
}

@Injectable()
export class InvoiceAgingRepository {
  constructor(
    @Inject(SaleInvoice.name)
    private readonly saleInvoiceModel: TenantModelProxy<typeof SaleInvoice>,

    @Inject(PaymentReceivedEntry.name)
    private readonly paymentEntryModel: TenantModelProxy<
      typeof PaymentReceivedEntry
    >,

    @Inject(PdChequeEntry.name)
    private readonly pdChequeEntryModel: TenantModelProxy<typeof PdChequeEntry>,
  ) {}

  public async computeRows(
    query: InvoiceAgingQueryDto,
    kind: 'outstanding' | 'rd',
  ): Promise<{
    rows: InvoiceAgingComputedRow[];
    titleArea: string;
    asDate: string;
  }> {
    const asDate = query.asDate || moment().format('YYYY-MM-DD');
    const areaIds = (query.areaIds || []).filter(Boolean);

    const invoices = await this.saleInvoiceModel()
      .query()
      .withGraphFetched('[customer.area, customer.routeCity]')
      .whereNotNull('deliveredAt')
      .where('invoiceDate', '<=', asDate)
      .onBuild((builder) => {
        if (kind === 'outstanding') {
          builder.modify('dueInvoices');
        }
      });

    const filtered = invoices.filter((invoice: any) => {
      if (!areaIds.length) {
        return true;
      }
      return areaIds.includes(Number(invoice.customer?.areaId));
    });

    const invoiceIds = filtered.map((invoice) => invoice.id);
    const paymentEntries = invoiceIds.length
      ? await this.paymentEntryModel()
          .query()
          .withGraphFetched('payment')
          .whereIn('invoiceId', invoiceIds)
      : [];
    const chequeEntries = invoiceIds.length
      ? await this.pdChequeEntryModel()
          .query()
          .withGraphFetched('cheque')
          .whereIn('invoiceId', invoiceIds)
      : [];

    const paymentsByInvoice = new Map<number, any[]>();
    paymentEntries.forEach((entry: any) => {
      const list = paymentsByInvoice.get(entry.invoiceId) || [];
      list.push(entry);
      paymentsByInvoice.set(entry.invoiceId, list);
    });
    const chequesByInvoice = new Map<number, any[]>();
    chequeEntries.forEach((entry: any) => {
      if (entry.cheque?.status === PD_CHEQUE_STATUS.RETURNED) {
        return;
      }
      const list = chequesByInvoice.get(entry.invoiceId) || [];
      list.push(entry);
      chequesByInvoice.set(entry.invoiceId, list);
    });

    const rows: InvoiceAgingComputedRow[] = [];

    for (const invoice of filtered) {
      const dueAmount = Number(invoice.dueAmount || 0);
      const invoiceAmount = Number(invoice.total || 0);
      const daysDue = daysBetween(invoice.invoiceDate, asDate);

      let undepositedCash = 0;
      let bankReceived = 0;
      (paymentsByInvoice.get(invoice.id) || []).forEach((entry: any) => {
        const amount = Number(entry.paymentAmount || 0);
        const payment = entry.payment;
        if (!payment) {
          return;
        }
        if (
          payment.paymentMethod === PAYMENT_METHODS.CASH &&
          !payment.depositedAt
        ) {
          undepositedCash += amount;
        } else {
          bankReceived += amount;
        }
      });

      let pendingCheque = 0;
      let realizedCheque = 0;
      (chequesByInvoice.get(invoice.id) || []).forEach((entry: any) => {
        const amount = Number(entry.paymentAmount || 0);
        if (entry.cheque?.status === PD_CHEQUE_STATUS.REALIZED) {
          realizedCheque += amount;
        } else {
          pendingCheque += amount;
        }
      });

      const unrealized = pendingCheque + undepositedCash;
      const realized = bankReceived + realizedCheque;
      const actualDue = invoiceAmount - realized;
      const buckets = emptyBuckets();
      const ageAmount = kind === 'outstanding' ? dueAmount : actualDue;
      buckets[bucketKeyForDays(daysDue)] = ageAmount;

      if (kind === 'outstanding' && dueAmount <= 0) {
        continue;
      }
      if (kind === 'rd' && actualDue <= 0) {
        continue;
      }

      rows.push({
        customerName: invoice.customer?.displayName || '',
        routeCity: invoice.customer?.routeCity?.name || '',
        invoiceDate: moment(invoice.invoiceDate).format('YYYY-MM-DD'),
        invoiceNo: invoice.invoiceNo,
        invoiceAmount,
        dueAmount,
        daysDue,
        buckets,
        totalOutstanding: dueAmount,
        unrealized,
        balance: invoiceAmount - unrealized,
        realized,
        pendingCheque,
        undepositedCash,
        actualDue,
      });
    }

    const areaNames = Array.from(
      new Set(
        filtered
          .map((invoice: any) => invoice.customer?.area?.name)
          .filter(Boolean),
      ),
    );
    const titleArea =
      !areaIds.length || areaNames.length === 0
        ? 'All'
        : areaNames.join(', ');

    return { rows, titleArea, asDate };
  }

  public buckets() {
    return OUTSTANDING_AGING_BUCKETS;
  }
}
