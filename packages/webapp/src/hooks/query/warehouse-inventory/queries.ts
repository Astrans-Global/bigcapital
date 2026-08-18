import { useQuery, useMutation, UseQueryOptions } from '@tanstack/react-query';
import type {
  WarehouseInventoryResponse,
  WarehouseInventoryQuery,
} from '@bigcapital/sdk-ts';
import { fetchWarehouseInventory } from '@bigcapital/sdk-ts';
import useApiRequest, { useApiFetcher } from '../../useRequest';
import { downloadFile } from '../../useDownloadFile';
import { warehouseInventoryKeys } from './query-keys';

/**
 * Warehouse inventory report -- see docs/ops/PHASE1.md
 * ("Warehouse inventory").
 */
export function useWarehouseInventory(
  query?: WarehouseInventoryQuery,
  props?: Omit<
    UseQueryOptions<WarehouseInventoryResponse>,
    'queryKey' | 'queryFn'
  >,
) {
  const fetcher = useApiFetcher({ enableCamelCaseTransform: true });
  return useQuery<WarehouseInventoryResponse>({
    ...props,
    queryKey: [...warehouseInventoryKeys.all(), query],
    queryFn: () => fetchWarehouseInventory(fetcher, query),
  });
}

export function useWarehouseInventoryXlsxExport(
  query?: WarehouseInventoryQuery,
) {
  const apiRequest = useApiRequest();

  return useMutation({
    mutationFn: () =>
      apiRequest
        .get('/reports/warehouse-inventory', {
          responseType: 'blob',
          headers: { accept: 'application/xlsx' },
          params: query ?? {},
        })
        .then((res) => {
          downloadFile(res.data, 'warehouse_inventory.xlsx');
          return res;
        }),
  });
}
