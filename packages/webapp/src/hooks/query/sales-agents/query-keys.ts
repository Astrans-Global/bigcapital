export const SALES_AGENTS = 'SALES_AGENTS';
export const SALES_AGENT = 'SALES_AGENT';

export const salesAgentsKeys = {
  all: () => [SALES_AGENTS] as const,
  detail: (id: number | null | undefined) => [SALES_AGENT, id] as const,
};

export const SalesAgentsQueryKeys = {
  SALES_AGENTS,
  SALES_AGENT,
} as const;
