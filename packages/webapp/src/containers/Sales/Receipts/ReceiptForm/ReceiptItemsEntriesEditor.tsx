// @ts-nocheck
import React from 'react';
import { FastField } from 'formik';
import { x } from '@xstyled/emotion';
import { ItemsEntriesTable } from '@/containers/Entries/ItemsEntriesTable';
import { useReceiptFormContext } from './ReceiptFormProvider';
import {
  applyInvoiceTaxRateToEntries,
  entriesFieldShouldUpdate,
  MAX_RECEIPT_LINES,
} from './utils';
import { ITEM_TYPE } from '@/containers/Entries/utils';
import { TaxType } from '@/interfaces/TaxRates';

export function ReceiptItemsEntriesEditor() {
  const { items, taxRates, receiptId } = useReceiptFormContext();

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
                  values.receipt_tax_rate_id,
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
            excludeInvoiceId={receiptId}
            minLinesNumber={1}
            maxLinesNumber={MAX_RECEIPT_LINES}
          />
        )}
      </FastField>
    </x.div>
  );
}
