export const CUSTOMER_AREAS = 'CUSTOMER_AREAS';
export const CUSTOMER_AREA = 'CUSTOMER_AREA';

export const customerAreasKeys = {
  all: () => [CUSTOMER_AREAS] as const,
  detail: (id: number | null | undefined) => [CUSTOMER_AREA, id] as const,
};

export const CustomerAreasQueryKeys = {
  CUSTOMER_AREAS,
  CUSTOMER_AREA,
} as const;
