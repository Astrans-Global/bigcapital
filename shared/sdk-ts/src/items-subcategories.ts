// @ts-nocheck
// Item subcategories are a new endpoint not present in the generated OpenAPI
// `paths` schema yet, so this file talks to the fetcher without the
// `keyof paths` compile-time constraint used by the codegen-backed modules.
import type { ApiFetcher } from './fetch-utils';

export const ITEMS_SUBCATEGORIES_ROUTES = {
  LIST: '/api/item-subcategories',
  BY_ID: '/api/item-subcategories/{id}',
} as const;

export interface ItemSubcategory {
  id: number;
  name: string;
  description?: string;
  categoryId: number;
  userId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type ItemSubcategoriesListResponse = ItemSubcategory[];

export interface CreateItemSubcategoryBody {
  name: string;
  description?: string;
  categoryId: number;
}
export interface EditItemSubcategoryBody extends CreateItemSubcategoryBody {}

export interface ItemSubcategoriesListQuery {
  categoryId?: number;
}

export async function fetchItemSubcategories(
  fetcher: ApiFetcher,
  query?: ItemSubcategoriesListQuery,
): Promise<ItemSubcategoriesListResponse> {
  const get = fetcher.path(ITEMS_SUBCATEGORIES_ROUTES.LIST).method('get').create();
  const { data } = await get(query ?? {});
  return data as unknown as ItemSubcategoriesListResponse;
}

export async function fetchItemSubcategory(
  fetcher: ApiFetcher,
  id: number,
): Promise<ItemSubcategory> {
  const get = fetcher.path(ITEMS_SUBCATEGORIES_ROUTES.BY_ID).method('get').create();
  const { data } = await get({ id });
  return data as unknown as ItemSubcategory;
}

export async function createItemSubcategory(
  fetcher: ApiFetcher,
  values: CreateItemSubcategoryBody,
): Promise<void> {
  const post = fetcher.path(ITEMS_SUBCATEGORIES_ROUTES.LIST).method('post').create();
  await post(values);
}

export async function editItemSubcategory(
  fetcher: ApiFetcher,
  id: number,
  values: EditItemSubcategoryBody,
): Promise<void> {
  const put = fetcher.path(ITEMS_SUBCATEGORIES_ROUTES.BY_ID).method('put').create();
  await put({ id, ...values });
}

export async function deleteItemSubcategory(fetcher: ApiFetcher, id: number): Promise<void> {
  const del = fetcher.path(ITEMS_SUBCATEGORIES_ROUTES.BY_ID).method('delete').create();
  await del({ id });
}
