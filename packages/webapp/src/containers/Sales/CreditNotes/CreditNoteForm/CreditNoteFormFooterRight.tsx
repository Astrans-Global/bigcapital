// @ts-nocheck
import React from 'react';
import styled from 'styled-components';
import { useFormikContext } from 'formik';
import {
  T,
  TotalLines,
  TotalLine,
  TotalLineBorderStyle,
  TotalLineTextStyle,
} from '@/components';
import {
  useCreditNoteAdjustmentFormatted,
  useCreditNoteDiscountAmountFormatted,
  useCreditNoteSubtotalFormatted,
  useCreditNoteTotalFormatted,
  useCreditNoteTotalTaxAmount,
} from './utils';
import { DiscountTotalLine } from '../../Invoices/InvoiceForm/DiscountTotalLine';
import { AdjustmentTotalLine } from '../../Invoices/InvoiceForm/AdjustmentTotalLine';
import { CreditNoteTaxRateTotalLine } from './CreditNoteTaxRateTotalLine';
import { formattedAmount } from '@/utils';
import { useCreditNoteFormContext } from './CreditNoteFormProvider';

export function CreditNoteFormFooterRight() {
  const {
    values: { currency_code, credit_note_tax_rate_id },
  } = useFormikContext();
  const { taxRates } = useCreditNoteFormContext();

  const subtotalFormatted = useCreditNoteSubtotalFormatted();
  const totalFormatted = useCreditNoteTotalFormatted();
  const discountAmount = useCreditNoteDiscountAmountFormatted();
  const adjustmentAmount = useCreditNoteAdjustmentFormatted();
  const taxAmount = useCreditNoteTotalTaxAmount();
  const selectedTaxRate = (taxRates || []).find(
    (taxRate) => taxRate.id === credit_note_tax_rate_id,
  );
  const taxAmountFormatted = formattedAmount(taxAmount, currency_code);
  const vatRate = selectedTaxRate?.rate;

  return (
    <CreditNoteTotalLines labelColWidth={'180px'} amountColWidth={'180px'}>
      <TotalLine
        title={<T id={'credit_note.label_subtotal'} />}
        value={subtotalFormatted}
      />
      <DiscountTotalLine
        currencyCode={currency_code}
        discountAmount={discountAmount}
      />
      <CreditNoteTaxRateTotalLine />
      <TotalLine
        title={
          vatRate
            ? `VAT Amount (Total Value of Supply @${vatRate}%)`
            : 'VAT Amount'
        }
        value={taxAmountFormatted}
        borderStyle={TotalLineBorderStyle.None}
      />
      <AdjustmentTotalLine adjustmentAmount={adjustmentAmount} />
      <TotalLine
        title={<T id={'credit_note.label_total'} />}
        value={totalFormatted}
        borderStyle={TotalLineBorderStyle.SingleDark}
        textStyle={TotalLineTextStyle.Bold}
      />
    </CreditNoteTotalLines>
  );
}

const CreditNoteTotalLines = styled(TotalLines)`
  --x-color-text: #555555;

  .bp4-dark & {
    --x-color-text: var(--color-light-gray4);
  }
  width: 100%;
  color: var(--x-color-text);
`;
