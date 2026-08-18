export const WAREHOUSE_INVENTORY = 'WAREHOUSE_INVENTORY';

export const warehouseInventoryKeys = {
  all: () => [WAREHOUSE_INVENTORY] as const,
};

export const WarehouseInventoryQueryKeys = {
  WAREHOUSE_INVENTORY,
} as const;
