// @ts-nocheck
import { useCallback } from 'react';
import { css } from '@emotion/css';
import { x } from '@xstyled/emotion';
import { useFormikContext } from 'formik';
import { Suggest } from '@blueprintjs-formik/select';
import { TotalLinePrimitive } from '@/components';
import { useIsDarkMode } from '@/hooks/useDarkMode';
import { useBillFormContext } from './BillFormProvider';
import { useIsBillTaxExclusive, applyBillTaxRateToEntries } from './utils';

const suggestCss = css`
  .bp4-popover-target,
  .bp4-input-group {
    min-width: 140px;
  }
`;

/**
 * Single bill-wide "Tax rate" picker, applied to every line under the
 * hood -- see docs/ops/PHASE1.md ("Lots / GRN"): GRN VAT is one flat rate
 * for the whole bill, never picked per line. The aggregated tax amount(s)
 * still show via the existing tax total line(s) below, since all entries
 * now share this one tax_rate_id.
 */
export function BillTaxRateTotalLine() {
  const { values, setFieldValue } = useFormikContext();
  const { taxRates } = useBillFormContext();
  const isInclusiveTax = useIsBillTaxExclusive() === false;
  const isDarkMode = useIsDarkMode();

  const selectedTaxRate = taxRates.find(
    (taxRate) => taxRate.id === values.bill_tax_rate_id,
  );

  const handleTaxRateSelected = useCallback(
    (_value, taxRate) => {
      setFieldValue('bill_tax_rate_id', taxRate.id);
      setFieldValue(
        'entries',
        applyBillTaxRateToEntries(
          taxRate.id,
          taxRates,
          isInclusiveTax,
          values.entries,
        ),
      );
    },
    [setFieldValue, taxRates, isInclusiveTax, values.entries],
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
              selectedValue={values.bill_tax_rate_id}
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
