import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import type {
  SecondaryPnlResponse,
  SecondaryPnlQuery,
} from '@bigcapital/sdk-ts';
import { fetchSecondaryPnl } from '@bigcapital/sdk-ts';
import { useApiFetcher } from '../../useRequest';
import { secondaryPnlKeys } from './query-keys';

/**
 * Secondary P&L report -- lot cost vs. sell price variance per Delivered
 * invoice, see docs/ops/PHASE1.md ("Secondary P&L").
 */
export function useSecondaryPnl(
  query?: SecondaryPnlQuery,
  props?: Omit<UseQueryOptions<SecondaryPnlResponse>, 'queryKey' | 'queryFn'>,
) {
  const fetcher = useApiFetcher({ enableCamelCaseTransform: true });
  return useQuery<SecondaryPnlResponse>({
    ...props,
    queryKey: [...secondaryPnlKeys.all(), query],
    queryFn: () => fetchSecondaryPnl(fetcher, query),
  });
}
