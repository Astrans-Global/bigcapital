// @ts-nocheck
import React from 'react';
import { FastField } from 'formik';
import { ItemsEntriesTable } from '@/containers/Entries/ItemsEntriesTable';
import { useCreditNoteFormContext } from './CreditNoteFormProvider';
import {
  applyInvoiceTaxRateToEntries,
  entriesFieldShouldUpdate,
  MAX_CREDIT_NOTE_LINES,
} from './utils';
import { Box } from '@/components';
import { ITEM_TYPE } from '@/containers/Entries/utils';

/**
 * Credit note items entries editor field.
 *
 * Same 9-line / lot / invoice-level tax overlay as sale invoices. Price-lot
 * picker is optional: if the user picks a lot, returned quantity goes back
 * onto that lot. Lots with zero float still show so stock can restock a
 * fully sold batch. See docs/ops/PHASE1.md ("Credit notes").
 */
export function CreditNoteItemsEntriesEditorField() {
  const { items, taxRates } = useCreditNoteFormContext();

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
          meta: { error, touched },
        }) => (
          <ItemsEntriesTable
            value={value}
            onChange={(entries) => {
              setFieldValue(
                'entries',
                applyInvoiceTaxRateToEntries(
                  values.credit_note_tax_rate_id,
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
            includeZeroQty
            minLinesNumber={1}
            maxLinesNumber={MAX_CREDIT_NOTE_LINES}
          />
        )}
      </FastField>
    </Box>
  );
}
