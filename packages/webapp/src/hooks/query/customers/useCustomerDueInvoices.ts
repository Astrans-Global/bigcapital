import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import type { CustomerDueInvoicesResponse } from '@bigcapital/sdk-ts';
import { fetchCustomerDueInvoices } from '@bigcapital/sdk-ts';
import { useApiFetcher } from '../../useRequest';
import { customersKeys } from './query-keys';

export function useCustomerDueInvoices(
  customerId: number | null | undefined,
  query?: { excludeInvoiceId?: number },
  props?: Omit<
    UseQueryOptions<CustomerDueInvoicesResponse>,
    'queryKey' | 'queryFn'
  >,
) {
  const fetcher = useApiFetcher({ enableCamelCaseTransform: true });
  return useQuery<CustomerDueInvoicesResponse>({
    ...props,
    queryKey: customersKeys.dueInvoices(customerId, query),
    queryFn: () => fetchCustomerDueInvoices(fetcher, customerId!, query),
    enabled: customerId != null && props?.enabled !== false,
  });
}
