// Query key constants
export const DELIVERY_PREP_INVOICES = 'DELIVERY_PREP_INVOICES';
export const DELIVERY_PREP_TOTALS = 'DELIVERY_PREP_TOTALS';

// Query key factory
export const deliveryPrepKeys = {
  invoices: () => [DELIVERY_PREP_INVOICES] as const,
  totals: () => [DELIVERY_PREP_TOTALS] as const,
};

// Grouped object for use in components/hooks
export const DeliveryPrepQueryKeys = {
  DELIVERY_PREP_INVOICES,
  DELIVERY_PREP_TOTALS,
} as const;
