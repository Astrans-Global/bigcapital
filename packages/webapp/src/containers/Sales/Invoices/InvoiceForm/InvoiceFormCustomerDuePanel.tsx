// @ts-nocheck
import React, { useEffect, useRef, useState } from 'react';
import { useFormikContext } from 'formik';
import styled from 'styled-components';
import intl from 'react-intl-universal';
import { Alert, Intent, Spinner } from '@blueprintjs/core';
import { useCustomerDueInvoices } from '@/hooks/query';
import { useInvoiceFormContext } from './InvoiceFormProvider';
import { CustomerRiskTag } from '@/containers/Customers/CustomerRisk/CustomerRiskTag';
import { CustomerDueInvoicesTable } from '@/containers/Customers/CustomerRisk/CustomerDueInvoicesTable';

/**
 * Scrollable outstanding-invoices panel in the invoice header (the empty
 * zone to the right of customer/date fields). Class D customers get a
 * Proceed warning once per selection. See docs/ops/PHASE1.md ("Customers").
 */
export function InvoiceFormCustomerDuePanel() {
  const { values } = useFormikContext();
  const { invoiceId } = useInvoiceFormContext();
  const customerId = values.customer_id || null;
  const currencyCode = values.currency_code;

  const { data, isLoading, isFetching } = useCustomerDueInvoices(
    customerId,
    invoiceId ? { excludeInvoiceId: invoiceId } : undefined,
  );

  return (
    <>
      <PanelRoot>
        {!customerId ? (
          <EmptyHint>
            {intl.get('customer.due_invoices.select_hint') ||
              'Select a customer to see outstanding invoices and credit status.'}
          </EmptyHint>
        ) : (
          <>
            <PanelHeader>
              <span>
                {intl.get('customer.due_invoices.title') ||
                  'Outstanding invoices'}
              </span>
              <CustomerRiskTag category={data?.riskCategory} />
            </PanelHeader>
            {(isLoading || isFetching) && !data ? (
              <Spinner size={20} />
            ) : (
              <CustomerDueInvoicesTable
                invoices={data?.invoices}
                currencyCode={currencyCode}
              />
            )}
          </>
        )}
      </PanelRoot>
      <ClassDWarningAlert
        customerId={customerId}
        riskCategory={data?.riskCategory}
      />
    </>
  );
}

function ClassDWarningAlert({ customerId, riskCategory }) {
  const [isOpen, setIsOpen] = useState(false);
  const warnedForId = useRef(null);

  useEffect(() => {
    if (!customerId || riskCategory !== 'D') {
      return;
    }
    if (warnedForId.current === customerId) {
      return;
    }
    warnedForId.current = customerId;
    setIsOpen(true);
  }, [customerId, riskCategory]);

  return (
    <Alert
      isOpen={isOpen}
      intent={Intent.DANGER}
      confirmButtonText={
        intl.get('customer.risk.class_d.proceed') || 'Proceed'
      }
      onConfirm={() => setIsOpen(false)}
      onClose={() => setIsOpen(false)}
      canEscapeKeyCancel
      canOutsideClickCancel
    >
      <p>
        {intl.get('customer.risk.class_d.warning') ||
          'This is a Class D customer: at least one invoice is more than 90 days old and total due is over SLRs 1,000,000. Proceed only if you still want to invoice them.'}
      </p>
    </Alert>
  );
}

const PanelRoot = styled.div`
  flex: 1 1 280px;
  min-width: 260px;
  max-width: 560px;
  max-height: 220px;
  overflow: auto;
  padding: 10px 12px;
  border: 1px solid var(--color-invoice-form-header-border, #d2dce2);
  border-radius: 4px;
  background: transparent;

  .bp4-dark & {
    border-color: rgba(255, 255, 255, 0.1);
  }
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 600;
`;

const EmptyHint = styled.div`
  font-size: 12px;
  opacity: 0.6;
  padding: 18px 4px;
`;
