// @ts-nocheck
// Live customer A/B/C/D risk + outstanding delivered invoices. Not in the
// generated OpenAPI `paths` schema yet, see docs/ops/PHASE1.md ("Customers").
import type { ApiFetcher } from './fetch-utils';

export const CUSTOMER_DUE_INVOICES_ROUTES = {
  BY_CUSTOMER: '/api/customers/{id}/due-invoices',
} as const;

export type CustomerRiskCategory = 'A' | 'B' | 'C' | 'D';

export interface CustomerDueInvoiceRow {
  saleInvoiceId: number;
  invoiceNo: string | null;
  invoiceDate: string;
  dueAmount: number;
  daysDue: number;
}

export interface CustomerDueInvoicesResponse {
  customerId: number;
  riskCategory: CustomerRiskCategory;
  dueTotal: number;
  invoices: CustomerDueInvoiceRow[];
}

export interface CustomerDueInvoicesQuery {
  excludeInvoiceId?: number;
}

export async function fetchCustomerDueInvoices(
  fetcher: ApiFetcher,
  customerId: number,
  query?: CustomerDueInvoicesQuery,
): Promise<CustomerDueInvoicesResponse> {
  const get = fetcher
    .path(CUSTOMER_DUE_INVOICES_ROUTES.BY_CUSTOMER)
    .method('get')
    .create();
  const { data } = await get({
    id: customerId,
    excludeInvoiceId: query?.excludeInvoiceId,
  });
  return data as unknown as CustomerDueInvoicesResponse;
}
