import React, { createContext, useContext, useEffect, useState } from 'react';
import { Features } from '@/constants';
import { useFeatureCan, useSetSettings } from '@/hooks/state';
import { useProjects } from '@/containers/Projects/hooks';
import {
  useSettings,
  usePaymentReceiveEditPage,
  useAccounts,
  useCustomers,
  useBranches,
  useCreatePaymentReceive,
  useEditPaymentReceive,
  usePaymentReceivedState,
  useCreatePdCheque,
} from '@/hooks/query';
import { useGetPdfTemplates } from '@/hooks/query/pdf-templates';

type UseAccountsResult = ReturnType<typeof useAccounts>;
type UseBranchesResult = ReturnType<typeof useBranches>;
type UseGetPdfTemplatesResult = ReturnType<typeof useGetPdfTemplates>;
type UseCreatePaymentReceiveResult = ReturnType<typeof useCreatePaymentReceive>;
type UseEditPaymentReceiveResult = ReturnType<typeof useEditPaymentReceive>;
type UsePaymentReceivedStateResult = ReturnType<typeof usePaymentReceivedState>;

type PaymentReceiveSubmitPayload = Record<string, unknown>;

interface PaymentReceiveFormContextValue {
  paymentReceiveId?: number;
  paymentReceiveEditPage: any;
  paymentEntriesEditPage: any;
  accounts: UseAccountsResult['data'];
  customers: any;
  branches: UseBranchesResult['data'];
  projects: any;

  isPaymentLoading: boolean;
  isAccountsLoading: boolean;
  isPaymentFetching: boolean;
  isCustomersLoading: boolean;
  isFeatureLoading: boolean;
  isBranchesSuccess: boolean;
  isNewMode: boolean;

  submitPayload: PaymentReceiveSubmitPayload;
  setSubmitPayload: React.Dispatch<
    React.SetStateAction<PaymentReceiveSubmitPayload>
  >;

  editPaymentReceiveMutate: UseEditPaymentReceiveResult['mutateAsync'];
  createPaymentReceiveMutate: UseCreatePaymentReceiveResult['mutateAsync'];
  createPdChequeMutate: ReturnType<typeof useCreatePdCheque>['mutateAsync'];

  isExcessConfirmed: boolean;
  setIsExcessConfirmed: React.Dispatch<React.SetStateAction<boolean>>;

  brandingTemplates: UseGetPdfTemplatesResult['data'];
  isBrandingTemplatesLoading: boolean;

  isPaymentReceivedStateLoading: boolean;
  paymentReceivedState: UsePaymentReceivedStateResult['data'];

  isBootLoading: boolean;
}

type PaymentReceiveFormProviderProps = {
  query?: Record<string, unknown>;
  paymentReceiveId?: number;
  children?: React.ReactNode;
};

const PaymentReceiveFormContext = createContext<
  PaymentReceiveFormContextValue | undefined
>(undefined);

/**
 * Payment receive form provider.
 */
function PaymentReceiveFormProvider({
  query,
  paymentReceiveId,
  ...props
}: PaymentReceiveFormProviderProps) {
  const [submitPayload, setSubmitPayload] =
    React.useState<PaymentReceiveSubmitPayload>({});

  // Features guard.
  const { featureCan } = useFeatureCan();
  const isBranchFeatureCan = featureCan(Features.Branches);
  const isProjectsFeatureCan = featureCan(Features.Projects);

  // Fetches payment recevie details.
  const {
    data: paymentReceivedEditData,
    isLoading: isPaymentLoading,
    isFetching: isPaymentFetching,
  } = usePaymentReceiveEditPage(paymentReceiveId, {
    enabled: !!paymentReceiveId,
  });
  const paymentReceiveEditPage = paymentReceivedEditData?.data;
  const paymentEntriesEditPage = paymentReceivedEditData?.entries;

  // Handle fetch accounts data.
  const { data: accounts, isLoading: isAccountsLoading } = useAccounts();

  // Fetch all settings so collection number groups land in Redux.
  const { data: settingsPayload } = useSettings();
  const setSettings = useSetSettings();
  useEffect(() => {
    const options = Array.isArray(settingsPayload)
      ? settingsPayload
      : (settingsPayload as { settings?: unknown } | undefined)?.settings;
    if (Array.isArray(options) && options.length) {
      setSettings(options);
    }
  }, [settingsPayload, setSettings]);

  // Fetches customers list.
  const { data: customersData, isLoading: isCustomersLoading } = useCustomers({
    page_size: 10000,
  });

  // Fetches the branches list.
  const {
    data: branches,
    isLoading: isBranchesLoading,
    isSuccess: isBranchesSuccess,
  } = useBranches(query, { enabled: isBranchFeatureCan });

  // Fetches the projects list.
  const { data: projectsData } = useProjects(
    {},
    { enabled: !!isProjectsFeatureCan },
  );

  // Fetches branding templates of payment received module.
  const { data: brandingTemplates, isLoading: isBrandingTemplatesLoading } =
    useGetPdfTemplates({ resource: 'PaymentReceive' });

  // Fetches the payment received initial state.
  const {
    data: paymentReceivedState,
    isLoading: isPaymentReceivedStateLoading,
  } = usePaymentReceivedState();

  const isNewMode = !paymentReceiveId;

  const isFeatureLoading = isBranchesLoading;

  // Create and edit payment receive mutations.
  const { mutateAsync: editPaymentReceiveMutate } = useEditPaymentReceive();
  const { mutateAsync: createPaymentReceiveMutate } = useCreatePaymentReceive();
  const { mutateAsync: createPdChequeMutate } = useCreatePdCheque();

  const [isExcessConfirmed, setIsExcessConfirmed] = useState<boolean>(false);

  const isBootLoading =
    isPaymentLoading ||
    isAccountsLoading ||
    isCustomersLoading ||
    isBrandingTemplatesLoading ||
    isPaymentReceivedStateLoading;

  const provider: PaymentReceiveFormContextValue = {
    paymentReceiveId,
    paymentReceiveEditPage,
    paymentEntriesEditPage: paymentEntriesEditPage ?? [],
    accounts: accounts ?? [],
    customers: customersData?.data ?? [],
    branches: branches ?? [],
    projects: projectsData?.projects ?? [],

    isPaymentLoading,
    isAccountsLoading,
    isPaymentFetching,
    isCustomersLoading,
    isFeatureLoading,
    isBranchesSuccess,
    isNewMode,

    submitPayload,
    setSubmitPayload,

    editPaymentReceiveMutate,
    createPaymentReceiveMutate,
    createPdChequeMutate,

    isExcessConfirmed,
    setIsExcessConfirmed,

    brandingTemplates,
    isBrandingTemplatesLoading,

    isPaymentReceivedStateLoading,
    paymentReceivedState,

    isBootLoading,
  };

  return <PaymentReceiveFormContext.Provider value={provider} {...props} />;
}

const usePaymentReceiveFormContext = (): PaymentReceiveFormContextValue => {
  const ctx = useContext(PaymentReceiveFormContext);
  if (!ctx) {
    throw new Error(
      'usePaymentReceiveFormContext must be used within a PaymentReceiveFormProvider',
    );
  }
  return ctx;
};

export { PaymentReceiveFormProvider, usePaymentReceiveFormContext };
