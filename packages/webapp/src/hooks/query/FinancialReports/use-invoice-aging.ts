import {
  useMutation,
  useQuery,
  UseMutationOptions,
  UseQueryOptions,
} from '@tanstack/react-query';
import useApiRequest from '../../useRequest';
import { financialReportsKeys } from './query-keys';
import { downloadFile } from '../../useDownloadFile';

function useInvoiceAgingReport(
  path: string,
  keyFn: (query?: Record<string, unknown>) => readonly unknown[],
  query: Record<string, unknown>,
  props?: Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'>,
) {
  const apiRequest = useApiRequest();
  return useQuery({
    ...props,
    queryKey: keyFn(query),
    queryFn: () =>
      apiRequest
        .get(path, {
          params: query,
          headers: { Accept: 'application/json+table' },
        })
        .then((res) => res.data),
  });
}

export function useOutstandingAgingReport(
  query: Record<string, unknown>,
  props?: Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'>,
) {
  return useInvoiceAgingReport(
    'reports/outstanding-aging-summary',
    financialReportsKeys.outstandingAging,
    query,
    props,
  );
}

export function useRdOutstandingAgingReport(
  query: Record<string, unknown>,
  props?: Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'>,
) {
  return useInvoiceAgingReport(
    'reports/rd-outstanding-aging-summary',
    financialReportsKeys.rdOutstandingAging,
    query,
    props,
  );
}

function useAgingExport(
  path: string,
  filename: string,
  accept: string,
  query: Record<string, unknown>,
  args?: Omit<UseMutationOptions<void, Error, void>, 'mutationFn'>,
) {
  const apiRequest = useApiRequest();
  return useMutation({
    ...args,
    mutationFn: () =>
      apiRequest
        .get(path, {
          params: query,
          headers: { Accept: accept },
          responseType: 'blob',
        })
        .then((res) => downloadFile(res.data, filename)),
  });
}

export function useOutstandingAgingXlsx(query: Record<string, unknown>) {
  return useAgingExport(
    'reports/outstanding-aging-summary',
    'outstanding-aging-summary.xlsx',
    'application/xlsx',
    query,
  );
}
export function useOutstandingAgingCsv(query: Record<string, unknown>) {
  return useAgingExport(
    'reports/outstanding-aging-summary',
    'outstanding-aging-summary.csv',
    'application/csv',
    query,
  );
}
export function useOutstandingAgingPdf(query: Record<string, unknown>) {
  return useAgingExport(
    'reports/outstanding-aging-summary',
    'outstanding-aging-summary.pdf',
    'application/pdf',
    query,
  );
}
export function useRdOutstandingAgingXlsx(query: Record<string, unknown>) {
  return useAgingExport(
    'reports/rd-outstanding-aging-summary',
    'rd-outstanding-aging-summary.xlsx',
    'application/xlsx',
    query,
  );
}
export function useRdOutstandingAgingCsv(query: Record<string, unknown>) {
  return useAgingExport(
    'reports/rd-outstanding-aging-summary',
    'rd-outstanding-aging-summary.csv',
    'application/csv',
    query,
  );
}
export function useRdOutstandingAgingPdf(query: Record<string, unknown>) {
  return useAgingExport(
    'reports/rd-outstanding-aging-summary',
    'rd-outstanding-aging-summary.pdf',
    'application/pdf',
    query,
  );
}
