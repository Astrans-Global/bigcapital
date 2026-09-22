export const bankRecKeys = {
  all: () => ['bank-rec'] as const,
  lists: () => [...bankRecKeys.all(), 'list'] as const,
  list: (query?: Record<string, unknown>) =>
    [...bankRecKeys.lists(), query] as const,
  details: () => [...bankRecKeys.all(), 'detail'] as const,
  detail: (id: number, query?: Record<string, unknown>) =>
    [...bankRecKeys.details(), id, query] as const,
  eligibility: (accountId?: number, startDate?: string) =>
    [...bankRecKeys.all(), 'eligibility', accountId, startDate] as const,
};
