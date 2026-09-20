// @ts-nocheck
import type { ApiFetcher } from './fetch-utils';

export const SALES_AGENTS_ROUTES = {
  LIST: '/api/sales-agents',
  BY_ID: '/api/sales-agents/{id}',
} as const;

export interface SalesAgent {
  id: number;
  name: string;
  cashAccountId?: number;
  active?: boolean;
  userId?: number;
  createdAt?: string;
  updatedAt?: string;
  cashAccount?: { id: number; name: string };
}

export type SalesAgentsListResponse = SalesAgent[];

export interface CreateSalesAgentBody {
  name: string;
  active?: boolean;
}
export interface EditSalesAgentBody extends CreateSalesAgentBody {}

export async function fetchSalesAgents(
  fetcher: ApiFetcher,
): Promise<SalesAgentsListResponse> {
  const get = fetcher.path(SALES_AGENTS_ROUTES.LIST).method('get').create();
  const { data } = await get({});
  return data as unknown as SalesAgentsListResponse;
}

export async function fetchSalesAgent(
  fetcher: ApiFetcher,
  id: number,
): Promise<SalesAgent> {
  const get = fetcher.path(SALES_AGENTS_ROUTES.BY_ID).method('get').create();
  const { data } = await get({ id });
  return data as unknown as SalesAgent;
}

export async function createSalesAgent(
  fetcher: ApiFetcher,
  values: CreateSalesAgentBody,
): Promise<void> {
  const post = fetcher.path(SALES_AGENTS_ROUTES.LIST).method('post').create();
  await post(values);
}

export async function editSalesAgent(
  fetcher: ApiFetcher,
  id: number,
  values: EditSalesAgentBody,
): Promise<void> {
  const put = fetcher.path(SALES_AGENTS_ROUTES.BY_ID).method('put').create();
  await put({ id, ...values });
}

export async function deleteSalesAgent(
  fetcher: ApiFetcher,
  id: number,
): Promise<void> {
  const del = fetcher.path(SALES_AGENTS_ROUTES.BY_ID).method('delete').create();
  await del({ id });
}
