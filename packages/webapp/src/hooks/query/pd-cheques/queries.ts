import {
  useMutation,
  useQuery,
  useQueryClient,
  UseMutationOptions,
  UseQueryOptions,
} from '@tanstack/react-query';
import useApiRequest from '../../useRequest';
import { pdChequesKeys } from './query-keys';
import { paymentReceivesKeys } from '../payment-receives/query-keys';
import { invoicesKeys } from '../invoices/query-keys';
import { accountsKeys } from '../accounts/query-keys';
import { customersKeys } from '../customers/query-keys';
import { financialReportsKeys } from '../FinancialReports/query-keys';

const invalidate = (client: ReturnType<typeof useQueryClient>) => {
  client.invalidateQueries({ queryKey: pdChequesKeys.all() });
  client.invalidateQueries({ queryKey: paymentReceivesKeys.all() });
  client.invalidateQueries({ queryKey: invoicesKeys.all() });
  client.invalidateQueries({ queryKey: accountsKeys.all() });
  client.invalidateQueries({ queryKey: customersKeys.all() });
  client.invalidateQueries({ queryKey: financialReportsKeys.all() });
};

export function usePdCheques(
  query?: Record<string, unknown>,
  props?: Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'>,
) {
  const apiRequest = useApiRequest();
  return useQuery({
    ...props,
    queryKey: pdChequesKeys.list(query),
    queryFn: () =>
      apiRequest.get('pd-cheques', { params: query }).then((res) => res.data),
  });
}

export function useCreatePdCheque(props?: UseMutationOptions<void, Error, any>) {
  const client = useQueryClient();
  const apiRequest = useApiRequest();
  return useMutation({
    ...props,
    mutationFn: (values) =>
      apiRequest.post('pd-cheques', values).then((res) => res.data),
    onSuccess: (...args) => {
      invalidate(client);
      props?.onSuccess?.(...args);
    },
  });
}

export function useDepositPdCheque(
  props?: UseMutationOptions<void, Error, { id: number; bankAccountId: number }>,
) {
  const client = useQueryClient();
  const apiRequest = useApiRequest();
  return useMutation({
    ...props,
    mutationFn: ({ id, bankAccountId }) =>
      apiRequest
        .post(`pd-cheques/${id}/deposit`, { bankAccountId })
        .then((res) => res.data),
    onSuccess: (...args) => {
      invalidate(client);
      props?.onSuccess?.(...args);
    },
  });
}

export function useRealizePdCheque(
  props?: UseMutationOptions<
    void,
    Error,
    { id: number; bankAccountId: number; realizeDate?: string }
  >,
) {
  const client = useQueryClient();
  const apiRequest = useApiRequest();
  return useMutation({
    ...props,
    mutationFn: ({ id, bankAccountId, realizeDate }) =>
      apiRequest
        .post(`pd-cheques/${id}/realize`, { bankAccountId, realizeDate })
        .then((res) => res.data),
    onSuccess: (...args) => {
      invalidate(client);
      props?.onSuccess?.(...args);
    },
  });
}

export function useReturnPdCheque(
  props?: UseMutationOptions<void, Error, number>,
) {
  const client = useQueryClient();
  const apiRequest = useApiRequest();
  return useMutation({
    ...props,
    mutationFn: (id) =>
      apiRequest.post(`pd-cheques/${id}/return`).then((res) => res.data),
    onSuccess: (...args) => {
      invalidate(client);
      props?.onSuccess?.(...args);
    },
  });
}

export function useExportPdCheques() {
  const apiRequest = useApiRequest();
  return {
    xlsx: (query: Record<string, unknown>) =>
      apiRequest.get('pd-cheques', {
        params: query,
        headers: { Accept: 'application/xlsx' },
        responseType: 'blob',
      }),
    pdf: (query: Record<string, unknown>) =>
      apiRequest.get('pd-cheques', {
        params: query,
        headers: { Accept: 'application/pdf' },
        responseType: 'blob',
      }),
  };
}
