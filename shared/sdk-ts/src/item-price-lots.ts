// @ts-nocheck
// Item price-lots (GRN cost/discount batches) and the Astrans DMS invoice
// status pipeline are new endpoints not present in the generated OpenAPI
// `paths` schema yet, so this file talks to the fetcher without the
// `keyof paths` compile-time constraint used by the codegen-backed modules.
// See docs/ops/PHASE1.md ("Lots / GRN", "Status pipeline").
import type { ApiFetcher } from './fetch-utils';

export const ITEM_PRICE_LOTS_ROUTES = {
  LIST: '/api/item-price-lots',
} as const;

export const SALE_INVOICE_DMS_STATUS_ROUTES = {
  SET_STATUS: '/api/sale-invoices/{id}/dms-status',
} as const;

export interface ItemPriceLot {
  id: number;
  itemId: number;
  warehouseId: number;
  listPriceExclVat: number;
  discountPercent: number;
  vatRatePercent: number;
  unitCostNet: number;
  originalQty: number;
  realQty: number;
  reservedQty: number;
  floatQty: number;
  createdAt: string;
}

export type ItemPriceLotsListResponse = ItemPriceLot[];

export interface ItemPriceLotsListQuery {
  itemId?: number;
  warehouseId?: number;
  // Adds the invoice's own active holds back into each lot's float
  // quantity -- pass when editing an invoice that already reserved stock.
  excludeInvoiceId?: number;
  includeZeroQty?: boolean;
}

export type DmsStatus = 'pending' | 'reserved' | 'invoiced' | 'delivered';

export async function fetchItemPriceLots(
  fetcher: ApiFetcher,
  query?: ItemPriceLotsListQuery,
): Promise<ItemPriceLotsListResponse> {
  const get = fetcher.path(ITEM_PRICE_LOTS_ROUTES.LIST).method('get').create();
  const { data } = await get(query ?? {});
  return data as unknown as ItemPriceLotsListResponse;
}

export async function setSaleInvoiceDmsStatus(
  fetcher: ApiFetcher,
  id: number,
  status: DmsStatus,
): Promise<void> {
  const put = fetcher
    .path(SALE_INVOICE_DMS_STATUS_ROUTES.SET_STATUS)
    .method('put')
    .create();
  await put({ id, status });
}
