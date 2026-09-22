import {
  useMutation,
  useQuery,
  useQueryClient,
  UseMutationOptions,
  UseQueryOptions,
} from '@tanstack/react-query';
import useApiRequest from '../../useRequest';
import { bankRecKeys } from './query-keys';
import { invoicesKeys } from '../invoices/query-keys';
import { paymentReceivesKeys } from '../payment-receives/query-keys';

const invalidate = (client: ReturnType<typeof useQueryClient>) => {
  client.invalidateQueries({ queryKey: bankRecKeys.all() });
  client.invalidateQueries({ queryKey: invoicesKeys.all() });
  client.invalidateQueries({ queryKey: paymentReceivesKeys.all() });
};

export function useBankRecs(
  query?: Record<string, unknown>,
  props?: Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'>,
) {
  const apiRequest = useApiRequest();
  return useQuery({
    ...props,
    queryKey: bankRecKeys.list(query),
    queryFn: () =>
      apiRequest
        .get('banking/reconciliations', { params: query })
        .then((res) => res.data),
  });
}

export function useBankRecEligibility(
  accountId?: number,
  startDate?: string,
  props?: Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'>,
) {
  const apiRequest = useApiRequest();
  return useQuery({
    ...props,
    queryKey: bankRecKeys.eligibility(accountId, startDate),
    queryFn: () =>
      apiRequest
        .get('banking/reconciliations/eligibility', {
          params: {
            ...(accountId ? { accountId } : {}),
            ...(startDate ? { startDate } : {}),
          },
        })
        .then((res) => res.data),
  });
}

export function useBankRec(
  id: number,
  query?: Record<string, unknown>,
  props?: Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'>,
) {
  const apiRequest = useApiRequest();
  return useQuery({
    ...props,
    enabled: Boolean(id),
    queryKey: bankRecKeys.detail(id, query),
    queryFn: () =>
      apiRequest
        .get(`banking/reconciliations/${id}`, { params: query })
        .then((res) => res.data),
  });
}

export function useCreateBankRec(props?: UseMutationOptions<any, Error, any>) {
  const client = useQueryClient();
  const apiRequest = useApiRequest();
  return useMutation({
    ...props,
    mutationFn: (values) =>
      apiRequest.post('banking/reconciliations', values).then((res) => res.data),
    onSuccess: (...args) => {
      invalidate(client);
      props?.onSuccess?.(...args);
    },
  });
}

export function useSaveBankRec(
  props?: UseMutationOptions<any, Error, { id: number; values: any }>,
) {
  const client = useQueryClient();
  const apiRequest = useApiRequest();
  return useMutation({
    ...props,
    mutationFn: ({ id, values }) =>
      apiRequest
        .put(`banking/reconciliations/${id}`, values)
        .then((res) => res.data),
    onSuccess: (...args) => {
      invalidate(client);
      props?.onSuccess?.(...args);
    },
  });
}

export function useCloseBankRec(
  props?: UseMutationOptions<any, Error, { id: number; values: any }>,
) {
  const client = useQueryClient();
  const apiRequest = useApiRequest();
  return useMutation({
    ...props,
    mutationFn: ({ id, values }) =>
      apiRequest
        .post(`banking/reconciliations/${id}/close`, values)
        .then((res) => res.data),
    onSuccess: (...args) => {
      invalidate(client);
      props?.onSuccess?.(...args);
    },
  });
}

export function useReopenBankRec(
  props?: UseMutationOptions<any, Error, number>,
) {
  const client = useQueryClient();
  const apiRequest = useApiRequest();
  return useMutation({
    ...props,
    mutationFn: (id) =>
      apiRequest
        .post(`banking/reconciliations/${id}/reopen`)
        .then((res) => res.data),
    onSuccess: (...args) => {
      invalidate(client);
      props?.onSuccess?.(...args);
    },
  });
}

export function useDeleteBankRec(
  props?: UseMutationOptions<any, Error, number>,
) {
  const client = useQueryClient();
  const apiRequest = useApiRequest();
  return useMutation({
    ...props,
    mutationFn: (id) =>
      apiRequest
        .delete(`banking/reconciliations/${id}`)
        .then((res) => res.data),
    onSuccess: (...args) => {
      invalidate(client);
      props?.onSuccess?.(...args);
    },
  });
}
