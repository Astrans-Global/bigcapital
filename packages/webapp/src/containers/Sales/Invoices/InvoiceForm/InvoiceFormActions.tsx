// @ts-nocheck
import React from 'react';
import styled from 'styled-components';
import { FormGroup } from '@blueprintjs/core';
import { EntriesActionsBar } from '@/containers/Entries/EntriesActionBar';

/**
 * Invoice form actions. The DMS status control itself now lives in
 * `InvoiceFormTopBar` (top-right, always visible) so it's easier to find --
 * see docs/ops/PHASE1.md ("Status pipeline").
 * @returns {React.ReactNode}
 */
export function InvoiceFormActions() {
  return (
    <EntriesActionsBar>
      <InvoiceAmountsAreExclusiveNotice />
    </EntriesActionsBar>
  );
}

/**
 * Invoices always compute VAT as exclusive-of-tax (see docs/ops/PHASE1.md
 * "VAT" -- every invoice always carries VAT on its subtotal internally,
 * "Non-VAT invoice" is purely a print-format choice made later). The
 * "Amounts are" inclusive/exclusive picker is intentionally not offered
 * here anymore -- mirrors `BillFormEntriesActions.tsx`'s static notice.
 */
function InvoiceAmountsAreExclusiveNotice() {
  return (
    <StaticFormGroup label={'Amounts are'} inline={true}>
      <StaticValue>Exclusive of Tax</StaticValue>
    </StaticFormGroup>
  );
}

const StaticFormGroup = styled(FormGroup)`
  margin-left: auto;
`;

const StaticValue = styled.span`
  display: inline-flex;
  align-items: center;
  font-size: 14px;
  line-height: 30px;
  color: var(--x-color-text, #1c2126);

  .bp4-dark & {
    --x-color-text: var(--color-light-gray4);
  }
`;
