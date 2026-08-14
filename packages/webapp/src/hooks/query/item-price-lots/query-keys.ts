// Query key constants
export const ITEM_PRICE_LOTS = 'ITEM_PRICE_LOTS';

// Query key factory
export const itemPriceLotsKeys = {
  all: () => [ITEM_PRICE_LOTS] as const,
};

// Grouped object for use in components/hooks
export const ItemPriceLotsQueryKeys = {
  ITEM_PRICE_LOTS,
} as const;
