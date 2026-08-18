// @ts-nocheck
// Warehouse inventory report -- new endpoint not present in the generated
// OpenAPI `paths` schema yet, see docs/ops/PHASE1.md ("Warehouse inventory").
import type { ApiFetcher } from './fetch-utils';

export const WAREHOUSE_INVENTORY_ROUTES = {
  GET: '/api/reports/warehouse-inventory',
} as const;

export interface WarehouseInventoryRow {
  lotId: number;
  itemId: number;
  itemName: string;
  itemCode: string | null;
  warehouseId: number | null;
  warehouseName: string | null;
  listPriceExclVat: number;
  discountPercent: number;
  vatRatePercent: number;
  unitCostNet: number;
  realQty: number;
  reservedQty: number;
  invoicedQty: number;
  floatQty: number;
  packSizeLitres: number | null;
  litres: number | null;
  value: number;
}

export interface WarehouseInventoryResponse {
  rows: WarehouseInventoryRow[];
  totalLitres: number;
  totalValue: number;
}

export interface WarehouseInventoryQuery {
  warehouseId?: number;
  hideZeroQty?: boolean;
  includeInvoicedInFloat?: boolean;
}

export async function fetchWarehouseInventory(
  fetcher: ApiFetcher,
  query?: WarehouseInventoryQuery,
): Promise<WarehouseInventoryResponse> {
  const get = fetcher
    .path(WAREHOUSE_INVENTORY_ROUTES.GET)
    .method('get')
    .create();
  const { data } = await get(query ?? {});
  return data as unknown as WarehouseInventoryResponse;
}
