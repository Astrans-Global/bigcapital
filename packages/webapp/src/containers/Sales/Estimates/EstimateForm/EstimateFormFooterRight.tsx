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
  useEstimateDiscountFormatted,
  useEstimateSubtotalFormatted,
  useEstimateTotalFormatted,
  useEstimateTotalTaxAmount,
} from './utils';
import { DiscountTotalLine } from '../../Invoices/InvoiceForm/DiscountTotalLine';
import { EstimateTaxRateTotalLine } from './EstimateTaxRateTotalLine';
import { formattedAmount } from '@/utils';
import { useEstimateFormContext } from './EstimateFormProvider';

export function EstimateFormFooterRight() {
  const {
    values: { currency_code, estimate_tax_rate_id },
  } = useFormikContext();
  const { taxRates } = useEstimateFormContext();

  const subtotalFormatted = useEstimateSubtotalFormatted();
  const totalFormatted = useEstimateTotalFormatted();
  const discountAmountFormatted = useEstimateDiscountFormatted();
  const taxAmount = useEstimateTotalTaxAmount();
  const selectedTaxRate = (taxRates || []).find(
    (taxRate) => taxRate.id === estimate_tax_rate_id,
  );
  const taxAmountFormatted = formattedAmount(taxAmount, currency_code);
  const vatRate = selectedTaxRate?.rate;

  return (
    <EstimateTotalLines labelColWidth={'180px'} amountColWidth={'180px'}>
      <TotalLine
        title={<T id={'estimate_form.label.subtotal'} />}
        value={subtotalFormatted}
      />
      <DiscountTotalLine
        currencyCode={currency_code}
        discountAmount={discountAmountFormatted}
      />
      <EstimateTaxRateTotalLine />
      <TotalLine
        title={
          vatRate
            ? `VAT Amount (Total Value of Supply @${vatRate}%)`
            : 'VAT Amount'
        }
        value={taxAmountFormatted}
        borderStyle={TotalLineBorderStyle.None}
      />
      <TotalLine
        title={<T id={'estimate_form.label.total'} />}
        value={totalFormatted}
        textStyle={TotalLineTextStyle.Bold}
      />
    </EstimateTotalLines>
  );
}

const EstimateTotalLines = styled(TotalLines)`
  --x-color-text: #555;

  .bp4-dark & {
    --x-color-text: var(--color-light-gray4);
  }
  width: 100%;
  color: var(--x-color-text);
`;
