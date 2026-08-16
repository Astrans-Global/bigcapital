import {
  useMutation,
  useQuery,
  useQueryClient,
  UseMutationOptions,
  UseQueryOptions,
} from '@tanstack/react-query';
import type {
  CustomerRouteCity,
  CustomerRouteCitiesListResponse,
  CustomerRouteCitiesListQuery,
  CreateCustomerRouteCityBody,
  EditCustomerRouteCityBody,
} from '@bigcapital/sdk-ts';
import {
  fetchCustomerRouteCities,
  fetchCustomerRouteCity,
  createCustomerRouteCity,
  editCustomerRouteCity,
  deleteCustomerRouteCity,
} from '@bigcapital/sdk-ts';
import { useApiFetcher } from '../../useRequest';
import { customerRouteCitiesKeys } from './query-keys';

const commonInvalidateQueries = (
  queryClient: ReturnType<typeof useQueryClient>,
) => {
  queryClient.invalidateQueries({ queryKey: customerRouteCitiesKeys.all() });
};

export function useCreateCustomerRouteCity(
  props?: UseMutationOptions<void, Error, CreateCustomerRouteCityBody>,
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher({ enableCamelCaseTransform: true });

  return useMutation({
    ...props,
    mutationFn: (values: CreateCustomerRouteCityBody) =>
      createCustomerRouteCity(fetcher, values),
    onSuccess: (...args) => {
      commonInvalidateQueries(queryClient);
      props?.onSuccess?.(...args);
    },
  });
}

export function useEditCustomerRouteCity(
  props?: UseMutationOptions<
    void,
    Error,
    [number, EditCustomerRouteCityBody]
  >,
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher({ enableCamelCaseTransform: true });

  return useMutation({
    ...props,
    mutationFn: ([id, values]: [number, EditCustomerRouteCityBody]) =>
      editCustomerRouteCity(fetcher, id, values),
    onSuccess: (data, variables, ...rest) => {
      queryClient.invalidateQueries({
        queryKey: customerRouteCitiesKeys.detail(variables[0]),
      });
      commonInvalidateQueries(queryClient);
      props?.onSuccess?.(data, variables, ...rest);
    },
  });
}

export function useDeleteCustomerRouteCity(
  props?: UseMutationOptions<void, Error, number>,
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher({ enableCamelCaseTransform: true });

  return useMutation({
    ...props,
    mutationFn: (id: number) => deleteCustomerRouteCity(fetcher, id),
    onSuccess: (data, id, ...rest) => {
      queryClient.invalidateQueries({
        queryKey: customerRouteCitiesKeys.detail(id),
      });
      commonInvalidateQueries(queryClient);
      props?.onSuccess?.(data, id, ...rest);
    },
  });
}

export function useCustomerRouteCities(
  query?: CustomerRouteCitiesListQuery,
  props?: Omit<
    UseQueryOptions<
      CustomerRouteCitiesListResponse,
      Error,
      CustomerRouteCitiesListResponse
    >,
    'queryKey' | 'queryFn'
  >,
) {
  const fetcher = useApiFetcher({ enableCamelCaseTransform: true });
  return useQuery<
    CustomerRouteCitiesListResponse,
    Error,
    CustomerRouteCitiesListResponse
  >({
    ...props,
    queryKey: [...customerRouteCitiesKeys.all(), query],
    queryFn: () => fetchCustomerRouteCities(fetcher, query),
  });
}

export function useCustomerRouteCity(
  id: number | null | undefined,
  props?: Omit<UseQueryOptions<CustomerRouteCity>, 'queryKey' | 'queryFn'>,
) {
  const fetcher = useApiFetcher({ enableCamelCaseTransform: true });
  return useQuery({
    ...props,
    queryKey: customerRouteCitiesKeys.detail(id),
    queryFn: () => fetchCustomerRouteCity(fetcher, id!),
    enabled: id != null,
  });
}
