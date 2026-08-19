// @ts-nocheck
import React from 'react';
import styled from 'styled-components';
import { useFormikContext } from 'formik';
import {
  TotalLines,
  TotalLine,
  TotalLineBorderStyle,
  TotalLineTextStyle,
} from '@/components';
import {
  useQuotationSubtotalFormatted,
  useQuotationTotalFormatted,
  useQuotationTotalTaxAmount,
} from './utils';
import { QuotationTaxRateTotalLine } from './QuotationTaxRateTotalLine';
import { formattedAmount } from '@/utils';
import { useQuotationFormContext } from './QuotationFormProvider';
import { Row, Col, Paper } from '@/components';
import { x } from '@xstyled/emotion';

export function QuotationFormFooter() {
  const {
    values: { currency_code, quotation_tax_rate_id },
  } = useFormikContext();
  const { taxRates } = useQuotationFormContext();
  const subtotalFormatted = useQuotationSubtotalFormatted();
  const totalFormatted = useQuotationTotalFormatted();
  const taxAmount = useQuotationTotalTaxAmount();
  const selectedTaxRate = (taxRates || []).find(
    (taxRate) => taxRate.id === quotation_tax_rate_id,
  );
  const taxAmountFormatted = formattedAmount(taxAmount, currency_code);
  const vatRate = selectedTaxRate?.rate;

  return (
    <x.div mt={'20px'} px={'32px'} pb={'20px'} flex={1}>
      <Paper p={'20px'}>
        <Row>
          <Col md={8} />
          <Col md={4}>
            <QuotationTotalLines labelColWidth={'180px'} amountColWidth={'180px'}>
              <TotalLine title={'Subtotal'} value={subtotalFormatted} />
              <QuotationTaxRateTotalLine />
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
                title={'Total'}
                value={totalFormatted}
                textStyle={TotalLineTextStyle.Bold}
              />
            </QuotationTotalLines>
          </Col>
        </Row>
      </Paper>
    </x.div>
  );
}

const QuotationTotalLines = styled(TotalLines)`
  width: 100%;
`;
