import React, { createContext, useContext } from 'react';
import { useCustomers } from '@/hooks/query';
import { FinancialHeaderLoadingSkeleton } from '../FinancialHeaderLoadingSkeleton';
import { asSelectItems } from '@/components/Forms/asSelectItems';

type UseCustomersResult = ReturnType<typeof useCustomers>;

type ARAgingSummaryGeneralContextValue = {
  customers: UseCustomersResult['data'] extends
    | { customers?: infer C }
    | undefined
    ? C
    : undefined;
  isCustomersLoading: boolean;
};

const ARAgingSummaryGeneralContext = createContext<
  ARAgingSummaryGeneralContextValue | undefined
>(undefined);

function ARAgingSummaryGeneralProvider({
  children,
  ...props
}: {
  children?: React.ReactNode;
}) {
  const { data: customersData, isLoading: isCustomersLoading } = useCustomers();

  const provider: ARAgingSummaryGeneralContextValue = {
    customers: asSelectItems((customersData as any)?.customers ?? customersData),
    isCustomersLoading,
  };

  const loading = isCustomersLoading;

  return loading ? (
    <FinancialHeaderLoadingSkeleton />
  ) : (
    <ARAgingSummaryGeneralContext.Provider value={provider} {...props}>
      {children}
    </ARAgingSummaryGeneralContext.Provider>
  );
}

const useARAgingSummaryGeneralContext =
  (): ARAgingSummaryGeneralContextValue => {
    const ctx = useContext(ARAgingSummaryGeneralContext);
    if (!ctx)
      throw new Error(
        'useARAgingSummaryGeneralContext must be used within ARAgingSummaryGeneralProvider',
      );
    return ctx;
  };

export { ARAgingSummaryGeneralProvider, useARAgingSummaryGeneralContext };
