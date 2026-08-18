import { Inject, Injectable } from '@nestjs/common';
import * as moment from 'moment';
import { SaleInvoice } from '@/modules/SaleInvoices/models/SaleInvoice';
import { Customer } from '../models/Customer';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import {
  computeCustomerRiskCategory,
  CustomerRiskCategory,
} from '../risk/computeCustomerRiskCategory';

export interface CustomerDueInvoiceRow {
  saleInvoiceId: number;
  invoiceNo: string | null;
  invoiceDate: string;
  dueAmount: number;
  daysDue: number;
}

export interface CustomerDueInvoicesSnapshot {
  customerId: number;
  riskCategory: CustomerRiskCategory;
  dueTotal: number;
  invoices: CustomerDueInvoiceRow[];
}

/**
 * Outstanding Delivered invoices + live A/B/C/D grade for a customer.
 * Pending/Reserved/Invoiced are not AR yet (books post on Delivered), so
 * they are excluded. Pre-Phase-1 rows with no dmsStatus but a deliveredAt
 * stamp count as delivered. See docs/ops/PHASE1.md ("Customers").
 */
@Injectable()
export class CustomerDueInvoicesService {
  constructor(
    @Inject(SaleInvoice.name)
    private readonly saleInvoiceModel: TenantModelProxy<typeof SaleInvoice>,

    @Inject(Customer.name)
    private readonly customerModel: TenantModelProxy<typeof Customer>,
  ) {}

  public async getForCustomer(
    customerId: number,
    excludeInvoiceId?: number,
  ): Promise<CustomerDueInvoicesSnapshot> {
    const customer = await this.customerModel()
      .query()
      .findById(customerId)
      .throwIfNotFound();

    const invoices = await this.loadDeliveredInvoices({
      customerIds: [customerId],
      excludeInvoiceId,
    });

    return this.buildSnapshot(customer.id, invoices);
  }

  public async getForCustomers(
    customerIds: number[],
  ): Promise<Map<number, CustomerDueInvoicesSnapshot>> {
    const uniqueIds = [...new Set(customerIds.filter(Boolean))];
    const result = new Map<number, CustomerDueInvoicesSnapshot>();

    if (!uniqueIds.length) {
      return result;
    }

    const invoices = await this.loadDeliveredInvoices({
      customerIds: uniqueIds,
    });
    const byCustomer = new Map<number, SaleInvoice[]>();

    invoices.forEach((invoice) => {
      const list = byCustomer.get(invoice.customerId) || [];
      list.push(invoice);
      byCustomer.set(invoice.customerId, list);
    });

    uniqueIds.forEach((customerId) => {
      result.set(
        customerId,
        this.buildSnapshot(customerId, byCustomer.get(customerId) || []),
      );
    });

    return result;
  }

  /**
   * Every customer currently in the org — used by the daily cron to write
   * `contacts.risk_category`. Customers with no open delivered dues become A.
   */
  public async getSnapshotsForAllCustomers(): Promise<
    Array<{
      customerId: number;
      riskCategory: CustomerRiskCategory;
      storedRiskCategory: CustomerRiskCategory;
    }>
  > {
    const customers = await this.customerModel()
      .query()
      .select('id', 'riskCategory');
    const invoices = await this.loadDeliveredInvoices({});
    const byCustomer = new Map<number, SaleInvoice[]>();

    invoices.forEach((invoice) => {
      const list = byCustomer.get(invoice.customerId) || [];
      list.push(invoice);
      byCustomer.set(invoice.customerId, list);
    });

    return customers.map((customer) => {
      const snapshot = this.buildSnapshot(
        customer.id,
        byCustomer.get(customer.id) || [],
      );
      return {
        customerId: customer.id,
        riskCategory: snapshot.riskCategory,
        storedRiskCategory: customer.riskCategory,
      };
    });
  }

  private buildSnapshot(
    customerId: number,
    invoices: SaleInvoice[],
  ): CustomerDueInvoicesSnapshot {
    const today = moment();
    const rows: CustomerDueInvoiceRow[] = invoices
      .map((invoice) => {
        const dueAmount = Number(invoice.dueAmount) || 0;
        return {
          saleInvoiceId: invoice.id,
          invoiceNo: invoice.invoiceNo ?? null,
          invoiceDate: invoice.invoiceDate
            ? moment(invoice.invoiceDate).format('YYYY-MM-DD')
            : '',
          dueAmount,
          daysDue: daysDueFromInvoiceDate(invoice.invoiceDate, today),
        };
      })
      .filter((row) => row.dueAmount > 0)
      .sort((a, b) => b.daysDue - a.daysDue);

    const dueTotal = rows.reduce((sum, row) => sum + row.dueAmount, 0);

    return {
      customerId,
      riskCategory: computeCustomerRiskCategory(rows),
      dueTotal,
      invoices: rows,
    };
  }

  private async loadDeliveredInvoices({
    customerIds,
    excludeInvoiceId,
  }: {
    customerIds?: number[];
    excludeInvoiceId?: number;
  }): Promise<SaleInvoice[]> {
    const query = this.saleInvoiceModel()
      .query()
      .where((builder) => {
        builder
          .where('dmsStatus', 'delivered')
          .orWhereNotNull('deliveredAt');
      });

    if (customerIds?.length) {
      query.whereIn('customerId', customerIds);
    }
    if (excludeInvoiceId) {
      query.whereNot('id', excludeInvoiceId);
    }

    return query;
  }
}

export function daysDueFromInvoiceDate(
  invoiceDate: Date | string | null | undefined,
  now: moment.Moment = moment(),
): number {
  if (!invoiceDate) {
    return 0;
  }
  return Math.max(
    moment(now).startOf('day').diff(moment(invoiceDate).startOf('day'), 'days'),
    0,
  );
}
