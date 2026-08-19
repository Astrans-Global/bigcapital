// @ts-nocheck
import React from 'react';
import moment from 'moment';
import * as R from 'ramda';
import { first, omit } from 'lodash';

import {
  defaultFastFieldShouldUpdate,
  transformToForm,
  repeatValue,
  formattedAmount,
  orderingLinesIndexes,
  toSafeNumber,
} from '@/utils';
import { useFormikContext } from 'formik';
import { useCreditNoteFormContext } from './CreditNoteFormProvider';

import {
  updateItemsEntriesTotal,
  ensureEntriesHaveEmptyLine,
} from '@/containers/Entries/utils';
import { useCurrentOrganizationBaseCurrency } from '@/hooks/query';
import { getEntriesTotal } from '@/containers/Entries/utils';
import {
  transformAttachmentsToForm,
  transformAttachmentsToRequest,
} from '@/containers/Attachments/utils';
import { convertBrandingTemplatesToOptions } from '@/containers/BrandingTemplates/BrandingTemplatesSelectFields';
import { applyInvoiceTaxRateToEntries } from '../../Invoices/InvoiceForm/utils';

export { applyInvoiceTaxRateToEntries };

export const MIN_LINES_NUMBER = 1;
export const MAX_CREDIT_NOTE_LINES = 9;

// Default entry object.
export const defaultCreditNoteEntry = {
  index: 0,
  item_id: '',
  rate: '',
  discount: '',
  quantity: '',
  description: '',
  tax_rate_id: '',
  tax_rate: '',
  tax_amount: '',
  item_price_lot_id: '',
};

const defaultCreditNoteEntryReq = {
  index: 0,
  item_id: '',
  rate: '',
  discount: '',
  quantity: '',
  description: '',
  tax_rate_id: '',
  item_price_lot_id: '',
};

// Default credit note object.
export const defaultCreditNote = {
  customer_id: '',
  credit_note_date: moment(new Date()).format('YYYY-MM-DD'),
  credit_note_number: '',
  // Holds the credit note number that entered manually only.
  credit_note_number_manually: false,
  open: '',
  reference_no: '',
  note: '',
  terms_conditions: '',
  branch_id: '',
  warehouse_id: '',
  exchange_rate: 1,
  currency_code: '',
  entries: [...repeatValue(defaultCreditNoteEntry, MIN_LINES_NUMBER)],
  attachments: [],
  pdf_template_id: '',
  discount: '',
  discount_type: 'percentage',
  adjustment: '',
  credit_note_message: '',
  credit_note_tax_rate_id: '',
  due_date: moment(new Date()).format('YYYY-MM-DD'),
};

/**
 * Transform credit note to initial values in edit mode.
 */
export function transformToEditForm(creditNote) {
  const initialEntries = [
    ...creditNote.entries.map((creditNote) => ({
      ...transformToForm(creditNote, defaultCreditNoteEntry),
    })),
    ...repeatValue(
      defaultCreditNoteEntry,
      Math.max(MIN_LINES_NUMBER - creditNote.entries.length, 0),
    ),
  ];
  const entries = R.compose(
    ensureEntriesHaveEmptyLine(defaultCreditNoteEntry),
    updateItemsEntriesTotal,
  )(initialEntries);

  const attachment = transformAttachmentsToForm(creditNote);
  const creditNoteTaxRateId =
    creditNote.entries.find((entry) => entry.tax_rate_id)?.tax_rate_id || '';

  return {
    ...transformToForm(creditNote, defaultCreditNote),
    due_date: creditNote.credit_note_date,
    credit_note_tax_rate_id: creditNoteTaxRateId,
    entries,
    attachment,
  };
}

/**
 * Transformes credit note entries to submit request.
 */
export const transformEntriesToSubmit = (entries) => {
  const transformCreditNoteEntry = R.compose(
    R.omit(['amount']),
    R.curry(transformToForm)(R.__, defaultCreditNoteEntryReq),
  );
  return R.compose(
    orderingLinesIndexes,
    R.map(transformCreditNoteEntry),
  )(entries);
};

/**
 * Filters the givne non-zero entries.
 */
export const filterNonZeroEntries = (entries) => {
  return entries.filter((item) => item.item_id && item.quantity);
};

/**
 * Transformes form values to request body.
 */
export const transformFormValuesToRequest = (values) => {
  const entries = filterNonZeroEntries(values.entries);
  const attachments = transformAttachmentsToRequest(values);

  return {
    ...omit(values, ['credit_note_tax_rate_id', 'due_date']),
    entries: transformEntriesToSubmit(entries),
    open: false,
    attachments,
    discount_type: 'percentage',
    note: values.note || '',
    credit_note_message: values.credit_note_message || '',
  };
};

/**
 * Determines customer name field when should update.
 */
export const customerNameFieldShouldUpdate = (newProps, oldProps) => {
  return (
    newProps.shouldUpdateDeps.items !== oldProps.shouldUpdateDeps.items ||
    defaultFastFieldShouldUpdate(newProps, oldProps)
  );
};

/**
 * Determines invoice entries field when should update.
 */
export const entriesFieldShouldUpdate = (newProps, oldProps) => {
  return (
    newProps.items !== oldProps.items ||
    defaultFastFieldShouldUpdate(newProps, oldProps)
  );
};

export const useSetPrimaryBranchToForm = () => {
  const { setFieldValue } = useFormikContext();
  const { branches, isBranchesSuccess, isNewMode } = useCreditNoteFormContext();

  React.useEffect(() => {
    if (isBranchesSuccess && isNewMode) {
      const primaryBranch = branches.find((b) => b.primary) || first(branches);

      if (primaryBranch) {
        setFieldValue('branch_id', primaryBranch.id);
      }
    }
  }, [isBranchesSuccess, setFieldValue, branches, isNewMode]);
};

export const useSetPrimaryWarehouseToForm = () => {
  const { setFieldValue } = useFormikContext();
  const { warehouses, isWarehousesSuccess, isNewMode } =
    useCreditNoteFormContext();

  React.useEffect(() => {
    if (isWarehousesSuccess && isNewMode) {
      const primaryWarehouse =
        warehouses.find((b) => b.primary) || first(warehouses);

      if (primaryWarehouse) {
        setFieldValue('warehouse_id', primaryWarehouse.id);
      }
    }
  }, [isWarehousesSuccess, setFieldValue, warehouses, isNewMode]);
};

/**
 * Retrieves the credit note subtotal.
 * @returns {number}
 */
export const useCreditNoteSubtotal = () => {
  const {
    values: { entries },
  } = useFormikContext();

  const total = React.useMemo(() => getEntriesTotal(entries), [entries]);

  return total;
};

/**
 * Retrieves the credit note subtotal formatted.
 * @returns {string}
 */
export const useCreditNoteSubtotalFormatted = () => {
  const subtotal = useCreditNoteSubtotal();
  const {
    values: { currency_code: currencyCode },
  } = useFormikContext();

  return formattedAmount(subtotal, currencyCode, { money: true });
};

/**
 * Retrieves the credit note discount amount.
 * @returns {number}
 */
export const useCreditNoteDiscountAmount = () => {
  const { values } = useFormikContext();
  const subtotal = useCreditNoteSubtotal();
  const discount = toSafeNumber(values.discount);

  return values?.discount_type === 'percentage'
    ? (discount * subtotal) / 100
    : discount;
};

/**
 * Retrieves the credit note discount amount formatted.
 * @returns {string}
 */
export const useCreditNoteDiscountAmountFormatted = () => {
  const discountAmount = useCreditNoteDiscountAmount();
  const {
    values: { currency_code: currencyCode },
  } = useFormikContext();

  return formattedAmount(discountAmount, currencyCode, { money: true });
};

/**
 * Retrieves the credit note adjustment amount.
 * @returns {number}
 */
export const useCreditNoteAdjustmentAmount = () => {
  const { values } = useFormikContext();

  return toSafeNumber(values.adjustment);
};

/**
 * Retrieves the credit note adjustment amount formatted.
 * @returns {string}
 */
export const useCreditNoteAdjustmentFormatted = () => {
  const adjustmentAmount = useCreditNoteAdjustmentAmount();
  const {
    values: { currency_code: currencyCode },
  } = useFormikContext();

  return formattedAmount(adjustmentAmount, currencyCode, { money: true });
};

/**
 * Retrieves the credit note total tax amount (VAT after header %).
 */
export const useCreditNoteTotalTaxAmount = () => {
  const { values } = useFormikContext();
  const { taxRates } = useCreditNoteFormContext();
  const subtotal = useCreditNoteSubtotal();
  const discountAmount = useCreditNoteDiscountAmount();

  return React.useMemo(() => {
    const selected = (taxRates || []).find(
      (taxRate) => taxRate.id === values.credit_note_tax_rate_id,
    );
    const rate = toSafeNumber(selected?.rate);
    const taxable = Math.max(subtotal - discountAmount, 0);
    return (taxable * rate) / 100;
  }, [taxRates, values.credit_note_tax_rate_id, subtotal, discountAmount]);
};

/**
 * Retrieves the credit note total.
 * @returns {number}
 */
export const useCreditNoteTotal = () => {
  const subtotal = useCreditNoteSubtotal();
  const discountAmount = useCreditNoteDiscountAmount();
  const adjustmentAmount = useCreditNoteAdjustmentAmount();
  const totalTaxAmount = useCreditNoteTotalTaxAmount();

  return R.compose(
    R.add(totalTaxAmount),
    R.subtract(R.__, discountAmount),
    R.add(R.__, adjustmentAmount),
  )(subtotal);
};

/**
 * Retrieves the credit note total formatted.
 * @returns {string}
 */
export const useCreditNoteTotalFormatted = () => {
  const total = useCreditNoteTotal();
  const {
    values: { currency_code: currencyCode },
  } = useFormikContext();

  return formattedAmount(total, currencyCode, { money: true });
};

/**
 * Detarmines whether the receipt has foreign customer.
 * @returns {boolean}
 */
export const useCreditNoteIsForeignCustomer = () => {
  const { values } = useFormikContext();
  const baseCurrency = useCurrentOrganizationBaseCurrency();

  const isForeignCustomer = React.useMemo(
    () => values.currency_code !== baseCurrency,
    [values.currency_code, baseCurrency],
  );
  return isForeignCustomer;
};

export const useCreditNoteFormBrandingTemplatesOptions = () => {
  const { brandingTemplates } = useCreditNoteFormContext();

  return React.useMemo(
    () => convertBrandingTemplatesToOptions(brandingTemplates),
    [brandingTemplates],
  );
};
