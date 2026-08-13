import {
  useMutation,
  useQuery,
  useQueryClient,
  UseMutationOptions,
  UseQueryOptions,
} from '@tanstack/react-query';
import type {
  ItemSubcategory,
  ItemSubcategoriesListResponse,
  ItemSubcategoriesListQuery,
  CreateItemSubcategoryBody,
  EditItemSubcategoryBody,
} from '@bigcapital/sdk-ts';
import {
  fetchItemSubcategories,
  fetchItemSubcategory,
  createItemSubcategory,
  editItemSubcategory,
  deleteItemSubcategory,
} from '@bigcapital/sdk-ts';
import { useApiFetcher } from '../../useRequest';
import { itemsSubcategoriesKeys } from './query-keys';

const commonInvalidateQueries = (
  queryClient: ReturnType<typeof useQueryClient>,
) => {
  queryClient.invalidateQueries({ queryKey: itemsSubcategoriesKeys.all() });
};

export function useCreateItemSubcategory(
  props?: UseMutationOptions<void, Error, CreateItemSubcategoryBody>,
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    ...props,
    mutationFn: (values: CreateItemSubcategoryBody) =>
      createItemSubcategory(fetcher, values),
    onSuccess: (...args) => {
      commonInvalidateQueries(queryClient);
      props?.onSuccess?.(...args);
    },
  });
}

export function useEditItemSubcategory(
  props?: UseMutationOptions<void, Error, [number, EditItemSubcategoryBody]>,
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    ...props,
    mutationFn: ([id, values]: [number, EditItemSubcategoryBody]) =>
      editItemSubcategory(fetcher, id, values),
    onSuccess: (data, variables, ...rest) => {
      queryClient.invalidateQueries({
        queryKey: itemsSubcategoriesKeys.detail(variables[0]),
      });
      commonInvalidateQueries(queryClient);
      props?.onSuccess?.(data, variables, ...rest);
    },
  });
}

export function useDeleteItemSubcategory(
  props?: UseMutationOptions<void, Error, number>,
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    ...props,
    mutationFn: (id: number) => deleteItemSubcategory(fetcher, id),
    onSuccess: (data, id, ...rest) => {
      queryClient.invalidateQueries({
        queryKey: itemsSubcategoriesKeys.detail(id),
      });
      commonInvalidateQueries(queryClient);
      props?.onSuccess?.(data, id, ...rest);
    },
  });
}

export function useItemsSubcategories(
  query?: ItemSubcategoriesListQuery,
  props?: Omit<
    UseQueryOptions<
      ItemSubcategoriesListResponse,
      Error,
      ItemSubcategoriesListResponse
    >,
    'queryKey' | 'queryFn'
  >,
) {
  const fetcher = useApiFetcher();
  return useQuery<
    ItemSubcategoriesListResponse,
    Error,
    ItemSubcategoriesListResponse
  >({
    ...props,
    queryKey: [...itemsSubcategoriesKeys.all(), query],
    queryFn: () => fetchItemSubcategories(fetcher, query),
  });
}

export function useItemSubcategory(
  id: number | null | undefined,
  props?: Omit<UseQueryOptions<ItemSubcategory>, 'queryKey' | 'queryFn'>,
) {
  const fetcher = useApiFetcher();
  return useQuery({
    ...props,
    queryKey: itemsSubcategoriesKeys.detail(id),
    queryFn: () => fetchItemSubcategory(fetcher, id!),
    enabled: id != null,
  });
}
