// Query key constants
export const SECONDARY_PNL = 'SECONDARY_PNL';

// Query key factory
export const secondaryPnlKeys = {
  all: () => [SECONDARY_PNL] as const,
};

// Grouped object for use in components/hooks
export const SecondaryPnlQueryKeys = {
  SECONDARY_PNL,
} as const;
