// @ts-nocheck
import React from 'react';
import { FastField } from 'formik';
import { x } from '@xstyled/emotion';
import { ItemsEntriesTable } from '@/containers/Entries/ItemsEntriesTable';
import { useInvoiceFormContext } from './InvoiceFormProvider';
import {
  entriesFieldShouldUpdate,
  applyInvoiceTaxRateToEntries,
} from './utils';
import { TaxType } from '@/interfaces/TaxRates';
import { ITEM_TYPE } from '@/containers/Entries/utils';

/**
 * Invoice items entries editor field.
 */
export function InvoiceItemsEntriesEditorField() {
  const { items, taxRates, invoiceId } = useInvoiceFormContext();

  return (
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
            // Re-stamp every line with the single invoice-wide tax rate
            // (if one is selected) whenever entries change -- new rows,
            // item picks, qty/discount edits, deletes, etc. -- since
            // there's no more per-line tax rate picker to set it. Mirrors
            // the Bill form's `BillFormBody`.
            setFieldValue(
              'entries',
              applyInvoiceTaxRateToEntries(
                values.invoice_tax_rate_id,
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
          isInclusiveTax={values.inclusive_exclusive_tax === TaxType.Inclusive}
          // GRN-style VAT: one flat rate for the whole invoice's subtotal
          // (see docs/ops/PHASE1.md "VAT"), never entered per line.
          enableTaxRates={false}
          // Astrans DMS price-lot picker -- see docs/ops/PHASE1.md
          // ("Lots / GRN"). Editing an existing invoice excludes its own
          // active holds from each lot's float qty (see
          // `GetItemPriceLotsService.excludeInvoiceOwnHold`).
          enablePriceLots
          warehouseId={values.warehouse_id}
          excludeInvoiceId={invoiceId}
        />
      )}
    </FastField>
  );
}
