import {
  useMutation,
  useQuery,
  useQueryClient,
  UseMutationOptions,
  UseQueryOptions,
} from '@tanstack/react-query';
import type {
  ItemPriceLotsListResponse,
  ItemPriceLotsListQuery,
  DmsStatus,
} from '@bigcapital/sdk-ts';
import { fetchItemPriceLots, setSaleInvoiceDmsStatus } from '@bigcapital/sdk-ts';
import { useApiFetcher } from '../../useRequest';
import { itemPriceLotsKeys } from './query-keys';
import { invoicesKeys } from '../invoices/query-keys';

/**
 * Item price-lots (GRN cost/discount batches) available for an item, with
 * their float (available) quantity per warehouse -- see docs/ops/PHASE1.md
 * ("Lots / GRN"). Disabled until an item is picked, since a lot list without
 * an item filter isn't meaningful for the invoice-line picker.
 */
export function useItemPriceLots(
  query?: ItemPriceLotsListQuery,
  props?: Omit<
    UseQueryOptions<ItemPriceLotsListResponse>,
    'queryKey' | 'queryFn'
  >,
) {
  // The server (like everywhere else) returns snake_case JSON -- this SDK
  // module's types are camelCase, so ask the fetcher to convert responses
  // rather than hand-rolling snake_case field names here.
  const fetcher = useApiFetcher({ enableCamelCaseTransform: true });
  return useQuery<ItemPriceLotsListResponse>({
    ...props,
    queryKey: [...itemPriceLotsKeys.all(), query],
    queryFn: () => fetchItemPriceLots(fetcher, query),
    enabled: !!query?.itemId && (props?.enabled ?? true),
  });
}

/**
 * Moves a sale invoice through the Astrans DMS pipeline (Pending -> Reserved
 * -> Invoiced -> Delivered) -- see docs/ops/PHASE1.md ("Status pipeline").
 */
export function useSetSaleInvoiceDmsStatus(
  props?: UseMutationOptions<void, Error, [number, DmsStatus]>,
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher({ enableCamelCaseTransform: true });

  return useMutation({
    ...props,
    mutationFn: ([id, status]: [number, DmsStatus]) =>
      setSaleInvoiceDmsStatus(fetcher, id, status),
    onSuccess: (data, variables, ...rest) => {
      queryClient.invalidateQueries({ queryKey: itemPriceLotsKeys.all() });
      queryClient.invalidateQueries({
        queryKey: invoicesKeys.detail(variables[0]),
      });
      queryClient.invalidateQueries({ queryKey: invoicesKeys.all() });
      props?.onSuccess?.(data, variables, ...rest);
    },
  });
}
