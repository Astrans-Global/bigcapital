// @ts-nocheck
import React from 'react';
import styled from 'styled-components';
import { FormGroup } from '@blueprintjs/core';
import { useFormikContext } from 'formik';
import intl from 'react-intl-universal';

/**
 * Invoice number field of the invoice form.
 *
 * Read-only: Astrans DMS assigns a per-area invoice number
 * (`YYMMM_ASTRANSQQ_XXXXX`) automatically once the invoice reaches the
 * "Invoiced" DMS status (or "Delivered", if "Invoiced" was skipped) --
 * see docs/ops/PHASE1.md ("Invoice numbers"). It's intentionally left
 * blank before that and can no longer be typed in manually.
 */
export function InvoiceFormInvoiceNumberField() {
  const { values } = useFormikContext();

  return (
    <NumberFormGroup label={intl.get('invoice_no')} inline={true}>
      {values.invoice_no ? (
        <StaticValue>{values.invoice_no}</StaticValue>
      ) : (
        <MutedHint>
          {intl.get('invoice_no_auto_assigned_hint') ||
            'Assigned automatically once moved to "Invoiced"'}
        </MutedHint>
      )}
    </NumberFormGroup>
  );
}
InvoiceFormInvoiceNumberField.displayName = 'InvoiceFormInvoiceNumberField';

const NumberFormGroup = styled(FormGroup)`
  &.bp4-inline {
    align-items: center;
  }

  .bp4-form-content {
    display: flex;
    align-items: center;
    min-height: 30px;
  }
`;

const StaticValue = styled.span`
  display: inline-flex;
  align-items: center;
  font-size: 13px;
  line-height: 30px;
  color: var(--x-color-text, #1c2126);

  .bp4-dark & {
    --x-color-text: var(--color-light-gray4);
  }
`;

const MutedHint = styled.span`
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  line-height: 30px;
  font-style: italic;
  color: var(--x-color-muted, #9ca7b3);

  .bp4-dark & {
    --x-color-muted: var(--color-gray1);
  }
`;
