import {
  useMutation,
  useQuery,
  useQueryClient,
  UseMutationOptions,
  UseQueryOptions,
} from '@tanstack/react-query';
import type {
  CustomerArea,
  CustomerAreasListResponse,
  CreateCustomerAreaBody,
  EditCustomerAreaBody,
} from '@bigcapital/sdk-ts';
import {
  fetchCustomerAreas,
  fetchCustomerArea,
  createCustomerArea,
  editCustomerArea,
  deleteCustomerArea,
} from '@bigcapital/sdk-ts';
import { useApiFetcher } from '../../useRequest';
import { customerAreasKeys } from './query-keys';

const commonInvalidateQueries = (
  queryClient: ReturnType<typeof useQueryClient>,
) => {
  queryClient.invalidateQueries({ queryKey: customerAreasKeys.all() });
};

export function useCreateCustomerArea(
  props?: UseMutationOptions<void, Error, CreateCustomerAreaBody>,
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher({ enableCamelCaseTransform: true });

  return useMutation({
    ...props,
    mutationFn: (values: CreateCustomerAreaBody) =>
      createCustomerArea(fetcher, values),
    onSuccess: (...args) => {
      commonInvalidateQueries(queryClient);
      props?.onSuccess?.(...args);
    },
  });
}

export function useEditCustomerArea(
  props?: UseMutationOptions<void, Error, [number, EditCustomerAreaBody]>,
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher({ enableCamelCaseTransform: true });

  return useMutation({
    ...props,
    mutationFn: ([id, values]: [number, EditCustomerAreaBody]) =>
      editCustomerArea(fetcher, id, values),
    onSuccess: (data, variables, ...rest) => {
      queryClient.invalidateQueries({
        queryKey: customerAreasKeys.detail(variables[0]),
      });
      commonInvalidateQueries(queryClient);
      props?.onSuccess?.(data, variables, ...rest);
    },
  });
}

export function useDeleteCustomerArea(
  props?: UseMutationOptions<void, Error, number>,
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher({ enableCamelCaseTransform: true });

  return useMutation({
    ...props,
    mutationFn: (id: number) => deleteCustomerArea(fetcher, id),
    onSuccess: (data, id, ...rest) => {
      queryClient.invalidateQueries({
        queryKey: customerAreasKeys.detail(id),
      });
      commonInvalidateQueries(queryClient);
      props?.onSuccess?.(data, id, ...rest);
    },
  });
}

export function useCustomerAreas(
  props?: Omit<
    UseQueryOptions<CustomerAreasListResponse, Error, CustomerAreasListResponse>,
    'queryKey' | 'queryFn'
  >,
) {
  const fetcher = useApiFetcher({ enableCamelCaseTransform: true });
  return useQuery<CustomerAreasListResponse, Error, CustomerAreasListResponse>({
    ...props,
    queryKey: customerAreasKeys.all(),
    queryFn: () => fetchCustomerAreas(fetcher),
  });
}

export function useCustomerArea(
  id: number | null | undefined,
  props?: Omit<UseQueryOptions<CustomerArea>, 'queryKey' | 'queryFn'>,
) {
  const fetcher = useApiFetcher({ enableCamelCaseTransform: true });
  return useQuery({
    ...props,
    queryKey: customerAreasKeys.detail(id),
    queryFn: () => fetchCustomerArea(fetcher, id!),
    enabled: id != null,
  });
}
