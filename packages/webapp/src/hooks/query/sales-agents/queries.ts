import {
  useMutation,
  useQuery,
  useQueryClient,
  UseMutationOptions,
  UseQueryOptions,
} from '@tanstack/react-query';
import type {
  SalesAgent,
  SalesAgentsListResponse,
  CreateSalesAgentBody,
  EditSalesAgentBody,
} from '@bigcapital/sdk-ts';
import {
  fetchSalesAgents,
  fetchSalesAgent,
  createSalesAgent,
  editSalesAgent,
  deleteSalesAgent,
} from '@bigcapital/sdk-ts';
import { useApiFetcher } from '../../useRequest';
import { salesAgentsKeys } from './query-keys';

const commonInvalidateQueries = (
  queryClient: ReturnType<typeof useQueryClient>,
) => {
  queryClient.invalidateQueries({ queryKey: salesAgentsKeys.all() });
};

export function useCreateSalesAgent(
  props?: UseMutationOptions<void, Error, CreateSalesAgentBody>,
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher({ enableCamelCaseTransform: true });

  return useMutation({
    ...props,
    mutationFn: (values: CreateSalesAgentBody) =>
      createSalesAgent(fetcher, values),
    onSuccess: (...args) => {
      commonInvalidateQueries(queryClient);
      props?.onSuccess?.(...args);
    },
  });
}

export function useEditSalesAgent(
  props?: UseMutationOptions<void, Error, [number, EditSalesAgentBody]>,
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher({ enableCamelCaseTransform: true });

  return useMutation({
    ...props,
    mutationFn: ([id, values]: [number, EditSalesAgentBody]) =>
      editSalesAgent(fetcher, id, values),
    onSuccess: (data, variables, ...rest) => {
      queryClient.invalidateQueries({
        queryKey: salesAgentsKeys.detail(variables[0]),
      });
      commonInvalidateQueries(queryClient);
      props?.onSuccess?.(data, variables, ...rest);
    },
  });
}

export function useDeleteSalesAgent(
  props?: UseMutationOptions<void, Error, number>,
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher({ enableCamelCaseTransform: true });

  return useMutation({
    ...props,
    mutationFn: (id: number) => deleteSalesAgent(fetcher, id),
    onSuccess: (data, id, ...rest) => {
      queryClient.invalidateQueries({
        queryKey: salesAgentsKeys.detail(id),
      });
      commonInvalidateQueries(queryClient);
      props?.onSuccess?.(data, id, ...rest);
    },
  });
}

export function useSalesAgents(
  props?: Omit<
    UseQueryOptions<SalesAgentsListResponse, Error, SalesAgentsListResponse>,
    'queryKey' | 'queryFn'
  >,
) {
  const fetcher = useApiFetcher({ enableCamelCaseTransform: true });
  return useQuery<SalesAgentsListResponse, Error, SalesAgentsListResponse>({
    ...props,
    queryKey: salesAgentsKeys.all(),
    queryFn: () => fetchSalesAgents(fetcher),
  });
}

export function useSalesAgent(
  id: number | null | undefined,
  props?: Omit<UseQueryOptions<SalesAgent>, 'queryKey' | 'queryFn'>,
) {
  const fetcher = useApiFetcher({ enableCamelCaseTransform: true });
  return useQuery({
    ...props,
    queryKey: salesAgentsKeys.detail(id),
    queryFn: () => fetchSalesAgent(fetcher, id!),
    enabled: id != null,
  });
}
