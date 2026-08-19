import React, { createContext, useContext } from 'react';
import {
  useQuotation,
  useItems,
  useWarehouses,
  useBranches,
  useCreateQuotation,
  useEditQuotation,
} from '@/hooks/query';
import { useTaxRates } from '@/hooks/query/tax-rates';
import { Features } from '@/constants';
import { useFeatureCan } from '@/hooks/state';

const ITEMS_FILTER_ROLES = JSON.stringify([
  {
    index: 1,
    fieldKey: 'sellable',
    value: true,
    condition: '&&',
    comparator: 'equals',
  },
  {
    index: 2,
    fieldKey: 'active',
    value: true,
    condition: '&&',
    comparator: 'equals',
  },
]);

const QuotationFormContext = createContext(undefined);

export function QuotationFormProvider({ quotationId, children }) {
  const { featureCan } = useFeatureCan();
  const isWarehouseFeatureCan = featureCan(Features.Warehouses);
  const isBranchFeatureCan = featureCan(Features.Branches);

  const { data: quotation, isLoading: isQuotationLoading } = useQuotation(
    quotationId,
  );
  const { data: itemsData, isLoading: isItemsLoading } = useItems({
    page_size: 10000,
    stringified_filter_roles: ITEMS_FILTER_ROLES,
  });
  const { data: taxRates, isLoading: isTaxRatesLoading } = useTaxRates();
  const {
    data: warehouses,
    isLoading: isWarehousesLoading,
    isSuccess: isWarehousesSuccess,
  } = useWarehouses({}, { enabled: isWarehouseFeatureCan });
  const {
    data: branches,
    isLoading: isBranchesLoading,
    isSuccess: isBranchesSuccess,
  } = useBranches({}, { enabled: isBranchFeatureCan });

  const { mutateAsync: createQuotationMutate } = useCreateQuotation();
  const { mutateAsync: editQuotationMutate } = useEditQuotation();
  const [submitPayload, setSubmitPayload] = React.useState({});

  const provider = {
    quotationId,
    quotation,
    items: itemsData?.data ?? [],
    taxRates: taxRates ?? [],
    warehouses,
    branches,
    isNewMode: !quotationId,
    isWarehousesSuccess,
    isBranchesSuccess,
    isBootLoading:
      isQuotationLoading ||
      isItemsLoading ||
      isTaxRatesLoading ||
      isWarehousesLoading ||
      isBranchesLoading,
    submitPayload,
    setSubmitPayload,
    createQuotationMutate,
    editQuotationMutate,
  };

  return (
    <QuotationFormContext.Provider value={provider}>
      {children}
    </QuotationFormContext.Provider>
  );
}

export const useQuotationFormContext = () => {
  const ctx = useContext(QuotationFormContext);
  if (!ctx) {
    throw new Error(
      'useQuotationFormContext must be used within QuotationFormProvider',
    );
  }
  return ctx;
};
