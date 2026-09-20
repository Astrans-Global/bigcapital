export const pdChequesKeys = {
  all: () => ['PD_CHEQUES'] as const,
  list: (query?: Record<string, unknown>) =>
    ['PD_CHEQUES', 'list', query] as const,
};
