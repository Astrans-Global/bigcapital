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
  useInvoiceAdjustmentAmountFormatted,
  useInvoiceDiscountAmountFormatted,
  useInvoiceDueAmountFormatted,
  useInvoicePaidAmountFormatted,
  useInvoiceSubtotalFormatted,
  useInvoiceTotalFormatted,
  useInvoiceTotalTaxAmount,
} from './utils';
import { TaxType } from '@/interfaces/TaxRates';
import { AdjustmentTotalLine } from './AdjustmentTotalLine';
import { DiscountTotalLine } from './DiscountTotalLine';
import { InvoiceTaxRateTotalLine } from './InvoiceTaxRateTotalLine';
import { formattedAmount } from '@/utils';
import { useInvoiceFormContext } from './InvoiceFormProvider';

export function InvoiceFormFooterRight() {
  const {
    values: { inclusive_exclusive_tax, currency_code, invoice_tax_rate_id },
  } = useFormikContext();
  const { taxRates } = useInvoiceFormContext();

  const adjustmentAmount = useInvoiceAdjustmentAmountFormatted();
  const discountAmount = useInvoiceDiscountAmountFormatted();
  const totalFormatted = useInvoiceTotalFormatted();
  const subtotalFormatted = useInvoiceSubtotalFormatted();
  const paidAmountFormatted = useInvoicePaidAmountFormatted();
  const dueAmountFormatted = useInvoiceDueAmountFormatted();
  const taxAmount = useInvoiceTotalTaxAmount();
  const selectedTaxRate = (taxRates || []).find(
    (taxRate) => taxRate.id === invoice_tax_rate_id,
  );
  const taxAmountFormatted = formattedAmount(taxAmount, currency_code);
  const vatRate = selectedTaxRate?.rate;

  return (
    <InvoiceTotalLines labelColWidth={'180px'} amountColWidth={'180px'}>
      <TotalLine
        title={
          <>
            {inclusive_exclusive_tax === TaxType.Inclusive
              ? 'Subtotal (Tax Inclusive)'
              : 'Subtotal'}
          </>
        }
        value={subtotalFormatted}
      />
      <DiscountTotalLine discountAmount={discountAmount} />
      <InvoiceTaxRateTotalLine />
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
        title={`Total (${currency_code})`}
        value={totalFormatted}
        borderStyle={TotalLineBorderStyle.SingleDark}
        textStyle={TotalLineTextStyle.Bold}
      />
      <TotalLine
        title={<T id={'invoice_form.label.payment_amount'} />}
        value={paidAmountFormatted}
        borderStyle={TotalLineBorderStyle.None}
      />
      <TotalLine
        title={<T id={'invoice_form.label.due_amount'} />}
        value={dueAmountFormatted}
        textStyle={TotalLineTextStyle.Bold}
      />
    </InvoiceTotalLines>
  );
}

const InvoiceTotalLines = styled(TotalLines)`
  --x-color-text: #555;

  .bp4-dark & {
    --x-color-text: var(--color-light-gray4);
  }
  width: 100%;
  color: var(--x-color-text);
`;
