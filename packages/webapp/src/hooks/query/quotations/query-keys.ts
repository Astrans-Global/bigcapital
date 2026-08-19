export const quotationsKeys = {
  all: () => ['SALE_QUOTATIONS'] as const,
  list: (query?: Record<string, unknown>) =>
    ['SALE_QUOTATIONS', query] as const,
  detail: (id: number | null | undefined) =>
    ['SALE_QUOTATION', id] as const,
};
