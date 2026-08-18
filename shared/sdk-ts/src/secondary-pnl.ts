// @ts-nocheck
// Secondary P&L report -- new endpoint not present in the generated OpenAPI
// `paths` schema yet, see docs/ops/PHASE1.md ("Secondary P&L").
import type { ApiFetcher } from './fetch-utils';

export const SECONDARY_PNL_ROUTES = {
  GET: '/api/reports/secondary-pnl',
} as const;

export interface SecondaryPnlRow {
  saleInvoiceId: number;
  invoiceNo: string | null;
  invoiceDate: string;
  warehouseId: number | null;
  warehouseName: string | null;
  customerId: number;
  customerName: string;
  areaId: number | null;
  areaName: string | null;
  invoicePnl: number;
}

export interface SecondaryPnlResponse {
  rows: SecondaryPnlRow[];
  totalPnl: number;
}

export interface SecondaryPnlQuery {
  warehouseId?: number;
  areaId?: number;
  dateFrom?: string;
  dateTo?: string;
}

export async function fetchSecondaryPnl(
  fetcher: ApiFetcher,
  query?: SecondaryPnlQuery,
): Promise<SecondaryPnlResponse> {
  const get = fetcher.path(SECONDARY_PNL_ROUTES.GET).method('get').create();
  const { data } = await get(query ?? {});
  return data as unknown as SecondaryPnlResponse;
}
