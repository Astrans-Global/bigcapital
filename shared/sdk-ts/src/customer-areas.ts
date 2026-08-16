// @ts-nocheck
// Customer areas are a new endpoint not present in the generated OpenAPI
// `paths` schema yet, so this file talks to the fetcher without the
// `keyof paths` compile-time constraint used by the codegen-backed modules.
import type { ApiFetcher } from './fetch-utils';

export const CUSTOMER_AREAS_ROUTES = {
  LIST: '/api/customer-areas',
  BY_ID: '/api/customer-areas/{id}',
} as const;

export interface CustomerArea {
  id: number;
  name: string;
  invoiceNumberCode?: string;
  nextInvoiceNumber: number;
  userId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type CustomerAreasListResponse = CustomerArea[];

export interface CreateCustomerAreaBody {
  name: string;
  invoiceNumberCode?: string;
  nextInvoiceNumber?: number;
}
export interface EditCustomerAreaBody extends CreateCustomerAreaBody {}

export async function fetchCustomerAreas(
  fetcher: ApiFetcher,
): Promise<CustomerAreasListResponse> {
  const get = fetcher.path(CUSTOMER_AREAS_ROUTES.LIST).method('get').create();
  const { data } = await get({});
  return data as unknown as CustomerAreasListResponse;
}

export async function fetchCustomerArea(
  fetcher: ApiFetcher,
  id: number,
): Promise<CustomerArea> {
  const get = fetcher.path(CUSTOMER_AREAS_ROUTES.BY_ID).method('get').create();
  const { data } = await get({ id });
  return data as unknown as CustomerArea;
}

export async function createCustomerArea(
  fetcher: ApiFetcher,
  values: CreateCustomerAreaBody,
): Promise<void> {
  const post = fetcher.path(CUSTOMER_AREAS_ROUTES.LIST).method('post').create();
  await post(values);
}

export async function editCustomerArea(
  fetcher: ApiFetcher,
  id: number,
  values: EditCustomerAreaBody,
): Promise<void> {
  const put = fetcher.path(CUSTOMER_AREAS_ROUTES.BY_ID).method('put').create();
  await put({ id, ...values });
}

export async function deleteCustomerArea(
  fetcher: ApiFetcher,
  id: number,
): Promise<void> {
  const del = fetcher.path(CUSTOMER_AREAS_ROUTES.BY_ID).method('delete').create();
  await del({ id });
}
