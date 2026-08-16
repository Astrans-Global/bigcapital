export const CUSTOMER_ROUTE_CITIES = 'CUSTOMER_ROUTE_CITIES';
export const CUSTOMER_ROUTE_CITY = 'CUSTOMER_ROUTE_CITY';

export const customerRouteCitiesKeys = {
  all: () => [CUSTOMER_ROUTE_CITIES] as const,
  detail: (id: number | null | undefined) =>
    [CUSTOMER_ROUTE_CITY, id] as const,
};

export const CustomerRouteCitiesQueryKeys = {
  CUSTOMER_ROUTE_CITIES,
  CUSTOMER_ROUTE_CITY,
} as const;
