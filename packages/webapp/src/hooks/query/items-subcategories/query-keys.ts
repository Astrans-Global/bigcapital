// Query key constants
export const ITEMS_SUBCATEGORIES = 'ITEMS_SUBCATEGORIES';
export const ITEM_SUBCATEGORY = 'ITEM_SUBCATEGORY';

// Query key factory
export const itemsSubcategoriesKeys = {
  all: () => [ITEMS_SUBCATEGORIES] as const,
  detail: (id: number | null | undefined) => [ITEM_SUBCATEGORY, id] as const,
};

// Grouped object for use in components/hooks
export const ItemsSubcategoriesQueryKeys = {
  ITEMS_SUBCATEGORIES,
  ITEM_SUBCATEGORY,
} as const;
