// @ts-nocheck
import React from 'react';
import { useParams } from 'react-router-dom';
import { css } from '@emotion/css';
import { QuotationForm } from './QuotationForm';
import {
  QuotationFormProvider,
  useQuotationFormContext,
} from './QuotationFormProvider';
import { DashboardInsider } from '@/components';

export function QuotationFormPage() {
  const { id } = useParams();
  const idInteger = id ? parseInt(id, 10) : undefined;

  return (
    <QuotationFormProvider quotationId={idInteger}>
      <QuotationFormPageContent />
    </QuotationFormProvider>
  );
}

function QuotationFormPageContent() {
  const { isBootLoading } = useQuotationFormContext();

  return (
    <DashboardInsider
      loading={isBootLoading}
      className={css`
        min-height: calc(100vh - var(--top-offset));
        max-height: calc(100vh - var(--top-offset));
      `}
    >
      <QuotationForm />
    </DashboardInsider>
  );
}
