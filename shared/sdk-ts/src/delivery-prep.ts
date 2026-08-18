// @ts-nocheck
// Delivery Prep worklist -- new endpoints not present in the generated
// OpenAPI `paths` schema yet, see docs/ops/PHASE1.md ("Delivery Prep").
import type { ApiFetcher } from './fetch-utils';

export const DELIVERY_PREP_ROUTES = {
  INVOICES: '/api/delivery-prep/invoices',
  TOTALS: '/api/delivery-prep/totals',
} as const;

export type DmsStatus = 'pending' | 'reserved' | 'invoiced' | 'delivered';

export interface DeliveryPrepInvoiceRow {
  saleInvoiceId: number;
  invoiceNo: string | null;
  invoiceDate: string;
  dmsStatus: DmsStatus;
  warehouseId: number | null;
  warehouseName: string | null;
  customerId: number;
  customerName: string;
  areaId: number | null;
  areaName: string | null;
  routeCityId: number | null;
  routeCityName: string | null;
}

export interface DeliveryPrepInvoicesQuery {
  warehouseId?: number;
  areaId?: number;
  routeCityId?: number[];
  dmsStatus?: DmsStatus[];
  dateFrom?: string;
  dateTo?: string;
}

export interface DeliveryPrepTotalsItemRow {
  itemId: number;
  itemName: string;
  itemCode: string | null;
  totalQuantity: number;
  packSizeLitres: number | null;
  totalLitres: number | null;
}

export interface DeliveryPrepTotalsResponse {
  items: DeliveryPrepTotalsItemRow[];
  totalLitres: number;
  invoiceCount: number;
}

const toCommaList = (value?: (string | number)[]) =>
  value && value.length ? value.join(',') : undefined;

export async function fetchDeliveryPrepInvoices(
  fetcher: ApiFetcher,
  query?: DeliveryPrepInvoicesQuery,
): Promise<DeliveryPrepInvoiceRow[]> {
  const get = fetcher.path(DELIVERY_PREP_ROUTES.INVOICES).method('get').create();
  const { data } = await get({
    ...query,
    routeCityId: toCommaList(query?.routeCityId),
    dmsStatus: toCommaList(query?.dmsStatus),
  });
  return data as unknown as DeliveryPrepInvoiceRow[];
}

export async function fetchDeliveryPrepTotals(
  fetcher: ApiFetcher,
  invoiceIds: number[],
): Promise<DeliveryPrepTotalsResponse> {
  const get = fetcher.path(DELIVERY_PREP_ROUTES.TOTALS).method('get').create();
  const { data } = await get({ invoiceIds: invoiceIds.join(',') });
  return data as unknown as DeliveryPrepTotalsResponse;
}
