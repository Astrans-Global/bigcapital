// @ts-nocheck
import React from 'react';
import intl from 'react-intl-universal';
import moment from 'moment';
import * as R from 'ramda';
import { omit, first } from 'lodash';
import { useFormikContext } from 'formik';
import {
  defaultFastFieldShouldUpdate,
  repeatValue,
  transformToForm,
  formattedAmount,
  toSafeNumber,
} from '@/utils';
import { useReceiptFormContext } from './ReceiptFormProvider';
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
import { TaxType } from '@/interfaces/TaxRates';

export { applyInvoiceTaxRateToEntries };

export const MIN_LINES_NUMBER = 1;
export const MAX_RECEIPT_LINES = 9;

export const defaultReceiptEntry = {
  index: 0,
  item_id: '',
  rate: '',
  discount: '',
  quantity: '',
  description: '',
  amount: '',
  tax_rate_id: '',
  tax_rate: '',
  tax_amount: '',
  item_price_lot_id: '',
};

const defaultReceiptEntryReq = {
  index: 0,
  item_id: '',
  rate: '',
  discount: '',
  quantity: '',
  description: '',
  tax_rate_id: '',
  item_price_lot_id: '',
};

export const defaultReceipt = {
  customer_id: '',
  deposit_account_id: '',
  receipt_number: '',
  // Holds the receipt number that entered manually only.
  receipt_number_manually: '',
  receipt_date: moment(new Date()).format('YYYY-MM-DD'),
  reference_no: '',
  receipt_message: '',
  terms_conditions: '',
  closed: '',
  branch_id: '',
  warehouse_id: '',
  exchange_rate: 1,
  currency_code: '',
  entries: [...repeatValue(defaultReceiptEntry, MIN_LINES_NUMBER)],
  attachments: [],
  pdf_template_id: '',
  discount: '',
  discount_type: 'percentage',
  adjustment: '',
  note: '',
  dms_payment_mode: '',
  receipt_tax_rate_id: '',
  due_date: moment(new Date()).format('YYYY-MM-DD'),
};

const ERRORS = {
  SALE_RECEIPT_NUMBER_NOT_UNIQUE: 'SALE_RECEIPT_NUMBER_NOT_UNIQUE',
  SALE_RECEIPT_NO_IS_REQUIRED: 'SALE_RECEIPT_NO_IS_REQUIRED',
};

/**
 * Transform to form in edit mode.
 */
export const transformToEditForm = (receipt) => {
  const initialEntries = [
    ...receipt.entries.map((entry) => ({
      ...transformToForm(entry, defaultReceiptEntry),
    })),
    ...repeatValue(
      defaultReceiptEntry,
      Math.max(MIN_LINES_NUMBER - receipt.entries.length, 0),
    ),
  ];
  const entries = R.compose(
    ensureEntriesHaveEmptyLine(defaultReceiptEntry),
    updateItemsEntriesTotal,
  )(initialEntries);

  const attachments = transformAttachmentsToForm(receipt);
  const receiptTaxRateId =
    receipt.entries.find((entry) => entry.tax_rate_id)?.tax_rate_id || '';

  return {
    ...transformToForm(receipt, defaultReceipt),
    due_date: receipt.receipt_date,
    receipt_tax_rate_id: receiptTaxRateId,
    entries,
    attachments,
  };
};

/**
 * Detarmines entries fast field should update.
 */
export const entriesFieldShouldUpdate = (newProps, oldProps) => {
  return (
    newProps.items !== oldProps.items ||
    defaultFastFieldShouldUpdate(newProps, oldProps)
  );
};

/**
 * Detarmines accounts fast field should update.
 */
export const accountsFieldShouldUpdate = (newProps, oldProps) => {
  return (
    newProps.items !== oldProps.items ||
    defaultFastFieldShouldUpdate(newProps, oldProps)
  );
};

/**
 * Detarmines customers fast field should update.
 */
export const customersFieldShouldUpdate = (newProps, oldProps) => {
  return (
    newProps.shouldUpdateDeps.items !== oldProps.shouldUpdateDeps.items ||
    defaultFastFieldShouldUpdate(newProps, oldProps)
  );
};

/**
 * Transform response error to fields.
 */
export const handleErrors = (errors, { setErrors }) => {
  if (errors.some((e) => e.type === ERRORS.SALE_RECEIPT_NUMBER_NOT_UNIQUE)) {
    setErrors({
      receipt_number: intl.get('sale_receipt_number_not_unique'),
    });
  }
  if (errors.some((e) => e.type === ERRORS.SALE_RECEIPT_NO_IS_REQUIRED)) {
    setErrors({
      receipt_number: intl.get('receipt.field.error.receipt_number_required'),
    });
  }
};

/**
 * Transformes the form values to request body.
 * @param {*} values
 * @returns
 */
export const transformFormValuesToRequest = (values) => {
  const entries = values.entries.filter(
    (item) => item.item_id && item.quantity,
  );
  const attachments = transformAttachmentsToRequest(values);

  return {
    ...omit(values, [
      'receipt_number_manually',
      'receipt_number',
      'receipt_tax_rate_id',
      'due_date',
    ]),
    ...(values.receipt_number_manually && {
      receipt_number: values.receipt_number,
    }),
    entries: entries.map((entry) => ({
      ...transformToForm(entry, defaultReceiptEntryReq),
    })),
    closed: false,
    attachments,
    discount_type: 'percentage',
    dms_payment_mode: values.dms_payment_mode || null,
    note: values.note || '',
  };
};

export const useSetPrimaryWarehouseToForm = () => {
  const { setFieldValue } = useFormikContext();
  const { warehouses, isWarehousesSuccess, isNewMode } =
    useReceiptFormContext();

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

export const useSetPrimaryBranchToForm = () => {
  const { setFieldValue } = useFormikContext();
  const { branches, isBranchesSuccess, isNewMode } = useReceiptFormContext();

  React.useEffect(() => {
    if (isBranchesSuccess && isNewMode) {
      const primaryBranch = branches.find((b) => b.primary) || first(branches);

      if (primaryBranch) {
        setFieldValue('branch_id', primaryBranch.id);
      }
    }
  }, [isBranchesSuccess, setFieldValue, branches, isNewMode]);
};

/**
 * Retrieves the receipt subtotal.
 * @returns {number}
 */
export const useReceiptSubtotal = () => {
  const {
    values: { entries },
  } = useFormikContext();

  // Retrieves the invoice entries total.
  const subtotal = React.useMemo(() => getEntriesTotal(entries), [entries]);

  return subtotal;
};

/**
 * Retrieves the formatted subtotal.
 * @returns {string}
 */
export const useReceiptSubtotalFormatted = () => {
  const subtotal = useReceiptSubtotal();
  const { values } = useFormikContext();

  return formattedAmount(subtotal, values.currency_code, { money: true });
};

/**
 * Retrieves the receipt discount amount.
 * @returns {number}
 */
export const useReceiptDiscountAmount = () => {
  const { values } = useFormikContext();
  const subtotal = useReceiptSubtotal();
  const discount = toSafeNumber(values.discount);

  return values?.discount_type === 'percentage'
    ? (subtotal * discount) / 100
    : discount;
};

/**
 * Retrieves the formatted discount amount.
 * @returns {string}
 */
export const useReceiptDiscountAmountFormatted = () => {
  const { values } = useFormikContext();
  const discount = useReceiptDiscountAmount();

  return formattedAmount(discount, values.currency_code);
};

/**
 * Retrieves the receipt adjustment amount.
 * @returns {number}
 */
export const useReceiptAdjustmentAmount = () => {
  const { values } = useFormikContext();
  const adjustment = toSafeNumber(values.adjustment);

  return adjustment;
};

/**
 * Retrieves the formatted adjustment amount.
 * @returns {string}
 */
export const useReceiptAdjustmentFormatted = () => {
  const { values } = useFormikContext();
  const adjustment = useReceiptAdjustmentAmount();

  return formattedAmount(adjustment, values.currency_code);
};

/**
 * Retrieves the receipt total tax amount (VAT after header %).
 */
export const useReceiptTotalTaxAmount = () => {
  const { values } = useFormikContext();
  const { taxRates } = useReceiptFormContext();
  const subtotal = useReceiptSubtotal();
  const discountAmount = useReceiptDiscountAmount();

  return React.useMemo(() => {
    const selected = (taxRates || []).find(
      (taxRate) => taxRate.id === values.receipt_tax_rate_id,
    );
    const rate = toSafeNumber(selected?.rate);
    const taxable = Math.max(subtotal - discountAmount, 0);
    return (taxable * rate) / 100;
  }, [taxRates, values.receipt_tax_rate_id, subtotal, discountAmount]);
};

/**
 * Retrieves the receipt total.
 * @returns {number}
 */
export const useReceiptTotal = () => {
  const subtotal = useReceiptSubtotal();
  const adjustmentAmount = useReceiptAdjustmentAmount();
  const discountAmount = useReceiptDiscountAmount();
  const totalTaxAmount = useReceiptTotalTaxAmount();

  return R.compose(
    R.add(totalTaxAmount),
    R.add(R.__, adjustmentAmount),
    R.subtract(R.__, discountAmount),
  )(subtotal);
};

/**
 * Retrieves the formatted receipt total.
 * @returns {string}
 */
export const useReceiptTotalFormatted = () => {
  const total = useReceiptTotal();
  const { values } = useFormikContext();

  return formattedAmount(total, values.currency_code);
};

/**
 * Retrieves the receipt paid amount.
 * @returns {number}
 */
export const useReceiptPaidAmount = () => {
  return useReceiptTotal();
};

/**
 * Retrieves the formatted receipt paid amount.
 * @returns {string}
 */
export const useReceiptPaidAmountFormatted = () => {
  const paidAmount = useReceiptPaidAmount();
  const { values } = useFormikContext();

  return formattedAmount(paidAmount, values.currency_code);
};

/**
 * Retrieves the receipt due amount.
 * @returns {number}
 */
export const useReceiptDueAmount = () => {
  const total = useReceiptTotal();
  const paidAmount = useReceiptPaidAmount();

  return total - paidAmount;
};

/**
 * Retrieves the formatted receipt due amount.
 * @returns {string}
 */
export const useReceiptDueAmountFormatted = () => {
  const dueAmount = useReceiptDueAmount();
  const { values } = useFormikContext();

  return formattedAmount(dueAmount, values.currency_code);
};

/**
 * Detarmines whether the receipt has foreign customer.
 * @returns {boolean}
 */
export const useReceiptIsForeignCustomer = () => {
  const { values } = useFormikContext();
  const baseCurrency = useCurrentOrganizationBaseCurrency();

  const isForeignCustomer = React.useMemo(
    () => values.currency_code !== baseCurrency,
    [values.currency_code, baseCurrency],
  );
  return isForeignCustomer;
};

export const resetFormState = ({ initialValues, values, resetForm }) => {
  resetForm({
    values: {
      // Reset the all values except the warehouse and brand id.
      ...initialValues,
      warehouse_id: values.warehouse_id,
      brand_id: values.brand_id,
    },
  });
};

export const useReceiptFormBrandingTemplatesOptions = () => {
  const { brandingTemplates } = useReceiptFormContext();

  return React.useMemo(
    () => convertBrandingTemplatesToOptions(brandingTemplates),
    [brandingTemplates],
  );
};
