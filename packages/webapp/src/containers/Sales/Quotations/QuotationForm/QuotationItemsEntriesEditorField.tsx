// @ts-nocheck
import React from 'react';
import { FastField } from 'formik';
import { ItemsEntriesTable } from '@/containers/Entries/ItemsEntriesTable';
import { useQuotationFormContext } from './QuotationFormProvider';
import {
  applyInvoiceTaxRateToEntries,
  entriesFieldShouldUpdate,
  MAX_QUOTATION_LINES,
} from './utils';
import { Box } from '@/components';
import { ITEM_TYPE } from '@/containers/Entries/utils';

export function QuotationItemsEntriesEditorField() {
  const { items, taxRates } = useQuotationFormContext();

  return (
    <Box p="18px 32px 0">
      <FastField
        name={'entries'}
        items={items}
        taxRates={taxRates}
        shouldUpdate={entriesFieldShouldUpdate}
      >
        {({
          form: { values, setFieldValue },
          field: { value },
          meta: { error },
        }) => (
          <ItemsEntriesTable
            value={value}
            onChange={(entries) => {
              setFieldValue(
                'entries',
                applyInvoiceTaxRateToEntries(
                  values.quotation_tax_rate_id,
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
            maxLinesNumber={MAX_QUOTATION_LINES}
          />
        )}
      </FastField>
    </Box>
  );
}
