// @ts-nocheck
import React from 'react';
import { x } from '@xstyled/emotion';
import { FastField } from 'formik';
import { ItemsEntriesTable } from '@/containers/Entries/ItemsEntriesTable';
import { useEstimateFormContext } from './EstimateFormProvider';
import {
  applyInvoiceTaxRateToEntries,
  entriesFieldShouldUpdate,
  MAX_ESTIMATE_LINES,
} from './utils';
import { ITEM_TYPE } from '@/containers/Entries/utils';

/**
 * Estimate line editor — same 9-line / lot / invoice-level tax overlay as
 * a Pending invoice. Lots are optional; nothing is reserved until the
 * estimate is sent to a Pending invoice and that invoice is later Reserved.
 */
export function EstimateFormItemsEntriesField() {
  const { items, taxRates } = useEstimateFormContext();

  return (
    <x.div p="18px 32px 0">
      <FastField
        name={'entries'}
        items={items}
        taxRates={taxRates}
        shouldUpdate={entriesFieldShouldUpdate}
      >
        {({
          form: { values, setFieldValue },
          field: { value },
          meta: { error, touched },
        }) => (
          <ItemsEntriesTable
            value={value}
            onChange={(entries) => {
              setFieldValue(
                'entries',
                applyInvoiceTaxRateToEntries(
                  values.estimate_tax_rate_id,
                  taxRates,
                  false,
                  entries,
                ),
              );
            }}
            items={items}
            taxRates={taxRates}
            itemType={ITEM_TYPE.SELLABLE}
            errors={error}
            linesNumber={4}
            currencyCode={values.currency_code}
            isInclusiveTax={false}
            enableTaxRates={false}
            enablePriceLots
            warehouseId={values.warehouse_id}
            minLinesNumber={1}
            maxLinesNumber={MAX_ESTIMATE_LINES}
          />
        )}
      </FastField>
    </x.div>
  );
}
