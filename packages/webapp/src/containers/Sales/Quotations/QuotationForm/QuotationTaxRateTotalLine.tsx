// @ts-nocheck
import React, { useCallback } from 'react';
import { css } from '@emotion/css';
import { x } from '@xstyled/emotion';
import { useFormikContext } from 'formik';
import { Suggest } from '@blueprintjs-formik/select';
import { TotalLinePrimitive } from '@/components';
import { useIsDarkMode } from '@/hooks/useDarkMode';
import { useQuotationFormContext } from './QuotationFormProvider';
import { applyInvoiceTaxRateToEntries } from './utils';

const suggestCss = css`
  .bp4-popover-target,
  .bp4-input-group {
    min-width: 140px;
  }
`;

export function QuotationTaxRateTotalLine() {
  const { values, setFieldValue } = useFormikContext();
  const { taxRates } = useQuotationFormContext();
  const isDarkMode = useIsDarkMode();

  const selectedTaxRate = (taxRates || []).find(
    (taxRate) => taxRate.id === values.quotation_tax_rate_id,
  );

  const handleTaxRateSelected = useCallback(
    (_value, taxRate) => {
      setFieldValue('quotation_tax_rate_id', taxRate.id);
      setFieldValue(
        'entries',
        applyInvoiceTaxRateToEntries(
          taxRate.id,
          taxRates,
          false,
          values.entries,
        ),
      );
    },
    [setFieldValue, taxRates, values.entries],
  );

  return (
    <TotalLinePrimitive>
      <TotalLinePrimitive.Title
        borderBottom={'1px solid var(--x-border-bottom-color)'}
        style={{
          '--x-border-bottom-color': isDarkMode
            ? 'rgba(255, 255, 255, 0.1)'
            : 'rgb(210, 221, 226)',
        }}
      >
        <x.div
          display={'flex'}
          alignItems={'center'}
          justifyContent={'space-between'}
        >
          <x.span pr={2}>Tax rate</x.span>
          <x.div className={suggestCss}>
            <Suggest<any>
              selectedValue={values.quotation_tax_rate_id}
              items={taxRates}
              valueAccessor={'id'}
              labelAccessor={'code'}
              textAccessor={'name_formatted'}
              popoverProps={{ minimal: true, boundary: 'window' }}
              inputProps={{ placeholder: 'Select tax rate...' }}
              fill={true}
              onItemChange={handleTaxRateSelected}
            />
          </x.div>
        </x.div>
      </TotalLinePrimitive.Title>
      <TotalLinePrimitive.Amount
        textAlign={'right'}
        borderBottom={'1px solid var(--x-border-bottom-color)'}
        style={{
          '--x-border-bottom-color': isDarkMode
            ? 'rgba(255, 255, 255, 0.1)'
            : 'rgb(210, 221, 226)',
        }}
      >
        {selectedTaxRate ? `${selectedTaxRate.rate}%` : ''}
      </TotalLinePrimitive.Amount>
    </TotalLinePrimitive>
  );
}
