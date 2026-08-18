// Query key constants
export const CUSTOMERS = 'CUSTOMERS';
export const CUSTOMER = 'CUSTOMER';

// Query key factory
export const customersKeys = {
  all: () => [CUSTOMERS] as const,
  list: (query?: Record<string, unknown>) => [CUSTOMERS, query] as const,
  detail: (id: number | null | undefined) => [CUSTOMER, id] as const,
  dueInvoices: (
    id: number | null | undefined,
    query?: Record<string, unknown>,
  ) => [CUSTOMER, id, 'due-invoices', query] as const,
};

// Grouped object for use in components/hooks
export const CustomersQueryKeys = {
  CUSTOMERS,
  CUSTOMER,
} as const;
