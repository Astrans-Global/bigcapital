import { createContext, useContext, ReactNode } from 'react';
import { FinancialHeaderLoadingSkeleton } from '../FinancialHeaderLoadingSkeleton';
import { useCustomers } from '@/hooks/query';
import { asSelectItems } from '@/components/Forms/asSelectItems';

interface CustomersTransactionsGeneralPanelContextValue {
  customers: any;
  isCustomersLoading: boolean;
  isCustomersFetching: boolean;
}

interface CustomersTransactionsGeneralPanelProviderProps {
  children?: ReactNode;
}

const CustomersTransactionsGeneralPanelContext = createContext<
  CustomersTransactionsGeneralPanelContextValue | undefined
>(undefined);

/**
 * Customers transactions provider.
 */
function CustomersTransactionsGeneralPanelProvider({
  ...props
}: CustomersTransactionsGeneralPanelProviderProps) {
  // Fetches the customers list.
  const {
    data: customersData,
    isFetching: isCustomersFetching,
    isLoading: isCustomersLoading,
  } = useCustomers();

  const provider: CustomersTransactionsGeneralPanelContextValue = {
    customers: asSelectItems(
      (customersData as any)?.customers ?? customersData?.data ?? customersData,
    ),
    isCustomersLoading,
    isCustomersFetching,
  };

  const loading = isCustomersLoading;

  return loading ? (
    <FinancialHeaderLoadingSkeleton />
  ) : (
    <CustomersTransactionsGeneralPanelContext.Provider
      value={provider}
      {...props}
    />
  );
}

const useCustomersTransactionsGeneralPanelContext =
  (): CustomersTransactionsGeneralPanelContextValue => {
    const ctx = useContext(CustomersTransactionsGeneralPanelContext);
    if (!ctx)
      throw new Error(
        'useCustomersTransactionsGeneralPanelContext must be used within a CustomersTransactionsGeneralPanelProvider',
      );
    return ctx;
  };

export {
  CustomersTransactionsGeneralPanelProvider,
  useCustomersTransactionsGeneralPanelContext,
};
