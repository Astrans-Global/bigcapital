export const ERRORS = {
  ITEM_PRICE_LOT_INSUFFICIENT_STOCK: 'ITEM_PRICE_LOT_INSUFFICIENT_STOCK',
  INVOICE_ALREADY_DELIVERED: 'INVOICE_ALREADY_DELIVERED',
  INVALID_DMS_STATUS: 'INVALID_DMS_STATUS',
};

/**
 * Astrans DMS invoice status pipeline -- see docs/ops/PHASE1.md
 * ("Status pipeline"). "delivered" is a one-way door: once set, it's
 * driven entirely by Bigcapital's native deliver/GL/inventory machinery,
 * not this status endpoint.
 */
export const DMS_STATUSES = [
  'pending',
  'reserved',
  'invoiced',
  'delivered',
] as const;

export type DmsStatus = (typeof DMS_STATUSES)[number];
