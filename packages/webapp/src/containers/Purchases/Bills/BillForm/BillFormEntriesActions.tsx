// @ts-nocheck
import styled from 'styled-components';
import { FormGroup } from '@blueprintjs/core';
import { EntriesActionsBar } from '@/containers/Entries/EntriesActionBar';

export function BillFormEntriesActions() {
  return (
    <EntriesActionsBar>
      <BillAmountsAreExclusiveNotice />
    </EntriesActionsBar>
  );
}

/**
 * Bills always compute VAT as exclusive-of-tax (see docs/ops/PHASE1.md
 * "VAT" -- GRN lines are VAT-excluded list prices, VAT is a single flat
 * rate on top). The "Amounts are" inclusive/exclusive picker that
 * Estimates/Invoices/Credit Notes expose is intentionally not offered
 * here: switching a bill to inclusive-of-tax desyncs the item price-lot
 * cost calculation (`ComputeItemPriceLotCost.ts`), which always assumes
 * an exclusive-tax GRN line. This is a static notice, not a control.
 */
function BillAmountsAreExclusiveNotice() {
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
  font-size: 12px;
  color: var(--x-color-text, #1c2126);

  .bp4-dark & {
    --x-color-text: var(--color-light-gray4);
  }
`;
