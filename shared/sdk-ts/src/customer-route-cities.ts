// @ts-nocheck
// Customer route cities are a new endpoint not present in the generated
// OpenAPI `paths` schema yet, so this file talks to the fetcher without the
// `keyof paths` compile-time constraint used by the codegen-backed modules.
import type { ApiFetcher } from './fetch-utils';

export const CUSTOMER_ROUTE_CITIES_ROUTES = {
  LIST: '/api/customer-route-cities',
  BY_ID: '/api/customer-route-cities/{id}',
} as const;

export interface CustomerRouteCity {
  id: number;
  name: string;
  areaId: number;
  userId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type CustomerRouteCitiesListResponse = CustomerRouteCity[];

export interface CreateCustomerRouteCityBody {
  name: string;
  areaId: number;
}
export interface EditCustomerRouteCityBody extends CreateCustomerRouteCityBody {}

export interface CustomerRouteCitiesListQuery {
  areaId?: number;
}

export async function fetchCustomerRouteCities(
  fetcher: ApiFetcher,
  query?: CustomerRouteCitiesListQuery,
): Promise<CustomerRouteCitiesListResponse> {
  const get = fetcher
    .path(CUSTOMER_ROUTE_CITIES_ROUTES.LIST)
    .method('get')
    .create();
  const { data } = await get(query ?? {});
  return data as unknown as CustomerRouteCitiesListResponse;
}

export async function fetchCustomerRouteCity(
  fetcher: ApiFetcher,
  id: number,
): Promise<CustomerRouteCity> {
  const get = fetcher
    .path(CUSTOMER_ROUTE_CITIES_ROUTES.BY_ID)
    .method('get')
    .create();
  const { data } = await get({ id });
  return data as unknown as CustomerRouteCity;
}

export async function createCustomerRouteCity(
  fetcher: ApiFetcher,
  values: CreateCustomerRouteCityBody,
): Promise<void> {
  const post = fetcher
    .path(CUSTOMER_ROUTE_CITIES_ROUTES.LIST)
    .method('post')
    .create();
  await post(values);
}

export async function editCustomerRouteCity(
  fetcher: ApiFetcher,
  id: number,
  values: EditCustomerRouteCityBody,
): Promise<void> {
  const put = fetcher
    .path(CUSTOMER_ROUTE_CITIES_ROUTES.BY_ID)
    .method('put')
    .create();
  await put({ id, ...values });
}

export async function deleteCustomerRouteCity(
  fetcher: ApiFetcher,
  id: number,
): Promise<void> {
  const del = fetcher
    .path(CUSTOMER_ROUTE_CITIES_ROUTES.BY_ID)
    .method('delete')
    .create();
  await del({ id });
}
