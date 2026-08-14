// @ts-nocheck
import { ItemsEntriesTable } from '@/containers/Entries/ItemsEntriesTable';
import { FastField } from 'formik';
import { useBillFormContext } from './BillFormProvider';
import {
  entriesFieldShouldUpdate,
  applyBillTaxRateToEntries,
  useIsBillTaxExclusive,
} from './utils';
import { ITEM_TYPE } from '@/containers/Entries/utils';

/**
 * Bill form body.
 */
export function BillFormBody({ defaultBill }) {
  const { items, taxRates } = useBillFormContext();
  const isInclusiveTax = useIsBillTaxExclusive() === false;

  return (
    <FastField
      name={'entries'}
      items={items}
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
            // Re-stamp every line with the single bill-wide tax rate
            // (if one is selected) whenever entries change -- new rows,
            // item picks, qty/discount edits, deletes, etc. -- since
            // there's no more per-line tax rate picker to set it.
            setFieldValue(
              'entries',
              applyBillTaxRateToEntries(
                values.bill_tax_rate_id,
                taxRates,
                isInclusiveTax,
                entries,
              ),
            );
          }}
          items={items}
          errors={error}
          linesNumber={4}
          currencyCode={values.currency_code}
          itemType={ITEM_TYPE.PURCHASABLE}
          taxRates={taxRates}
          landedCost={true}
          // GRN VAT is a single flat rate applied to the whole bill's
          // subtotal (see docs/ops/PHASE1.md "Lots / GRN"), never entered
          // per line -- same pattern as Estimates/Credit Notes.
          enableTaxRates={false}
        />
      )}
    </FastField>
  );
}
