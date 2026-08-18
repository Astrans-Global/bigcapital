import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import type {
  DeliveryPrepInvoiceRow,
  DeliveryPrepInvoicesQuery,
  DeliveryPrepTotalsResponse,
} from '@bigcapital/sdk-ts';
import { fetchDeliveryPrepInvoices, fetchDeliveryPrepTotals } from '@bigcapital/sdk-ts';
import { useApiFetcher } from '../../useRequest';
import { deliveryPrepKeys } from './query-keys';

/**
 * Delivery Prep invoice worklist -- see docs/ops/PHASE1.md ("Delivery Prep").
 */
export function useDeliveryPrepInvoices(
  query?: DeliveryPrepInvoicesQuery,
  props?: Omit<
    UseQueryOptions<DeliveryPrepInvoiceRow[]>,
    'queryKey' | 'queryFn'
  >,
) {
  const fetcher = useApiFetcher({ enableCamelCaseTransform: true });
  return useQuery<DeliveryPrepInvoiceRow[]>({
    ...props,
    queryKey: [...deliveryPrepKeys.invoices(), query],
    queryFn: () => fetchDeliveryPrepInvoices(fetcher, query),
  });
}

/**
 * Delivery Prep totals (quantity per item + total litres) for a ticked set
 * of invoices -- see docs/ops/PHASE1.md ("Delivery Prep").
 */
export function useDeliveryPrepTotals(
  invoiceIds: number[],
  props?: Omit<
    UseQueryOptions<DeliveryPrepTotalsResponse>,
    'queryKey' | 'queryFn'
  >,
) {
  const fetcher = useApiFetcher({ enableCamelCaseTransform: true });
  return useQuery<DeliveryPrepTotalsResponse>({
    ...props,
    enabled: invoiceIds.length > 0 && props?.enabled !== false,
    queryKey: [...deliveryPrepKeys.totals(), invoiceIds],
    queryFn: () => fetchDeliveryPrepTotals(fetcher, invoiceIds),
  });
}
