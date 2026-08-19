// @ts-nocheck
import React, { useMemo } from 'react';
import moment from 'moment';
import * as R from 'ramda';
import { omit, first } from 'lodash';
import { useFormikContext } from 'formik';
import {
  defaultFastFieldShouldUpdate,
  transformToForm,
  repeatValue,
  formattedAmount,
  orderingLinesIndexes,
  toSafeNumber,
} from '@/utils';
import {
  updateItemsEntriesTotal,
  ensureEntriesHaveEmptyLine,
  getEntriesTotal,
} from '@/containers/Entries/utils';
import { applyInvoiceTaxRateToEntries } from '../../Invoices/InvoiceForm/utils';
import { useQuotationFormContext } from './QuotationFormProvider';

export { applyInvoiceTaxRateToEntries };

export const MIN_LINES_NUMBER = 1;
export const MAX_QUOTATION_LINES = 12;

export const defaultQuotationEntry = {
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

const defaultQuotationEntryReq = {
  index: 0,
  item_id: '',
  rate: '',
  discount: '',
  quantity: '',
  description: '',
  tax_rate_id: '',
  item_price_lot_id: '',
};

export const defaultQuotation = {
  company_name: '',
  address_to: '',
  address_line_1: '',
  address_line_2: '',
  quotation_date: moment(new Date()).format('YYYY-MM-DD'),
  quotation_number: '',
  warehouse_id: '',
  branch_id: '',
  exchange_rate: 1,
  currency_code: '',
  entries: [...repeatValue(defaultQuotationEntry, MIN_LINES_NUMBER)],
  discount: '',
  discount_type: 'percentage',
  adjustment: '',
  quotation_tax_rate_id: '',
};

export function transformToEditForm(quotation) {
  const sourceEntries = (quotation.entries || []).map((entry) => ({
    ...entry,
    item_id: entry.item_id ?? entry.itemId,
    tax_rate_id: entry.tax_rate_id ?? entry.taxRateId,
    item_price_lot_id: entry.item_price_lot_id ?? entry.itemPriceLotId,
  }));
  const initialEntries = [
    ...sourceEntries.map((entry) => ({
      ...transformToForm(entry, defaultQuotationEntry),
    })),
    ...repeatValue(
      defaultQuotationEntry,
      Math.max(MIN_LINES_NUMBER - sourceEntries.length, 0),
    ),
  ];
  const entries = R.compose(
    ensureEntriesHaveEmptyLine(defaultQuotationEntry),
    updateItemsEntriesTotal,
  )(initialEntries);
  const taxRateId =
    sourceEntries.find((entry) => entry.tax_rate_id)?.tax_rate_id || '';

  return {
    ...transformToForm(quotation, defaultQuotation),
    quotation_tax_rate_id: taxRateId,
    entries,
  };
}

export const transformFormValuesToRequest = (values) => {
  const entries = values.entries.filter((item) => item.item_id && item.quantity);
  return {
    ...omit(values, ['quotation_tax_rate_id', 'quotation_number']),
    discount: 0,
    discount_type: 'percentage',
    adjustment: 0,
    entries: orderingLinesIndexes(
      entries.map((entry) => transformToForm(entry, defaultQuotationEntryReq)),
    ),
  };
};

export const entriesFieldShouldUpdate = (newProps, oldProps) => {
  return (
    newProps.items !== oldProps.items ||
    defaultFastFieldShouldUpdate(newProps, oldProps)
  );
};

export const useSetPrimaryWarehouseToForm = () => {
  const { setFieldValue } = useFormikContext();
  const { warehouses, isWarehousesSuccess, isNewMode } =
    useQuotationFormContext();

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
  const { branches, isBranchesSuccess, isNewMode } = useQuotationFormContext();

  React.useEffect(() => {
    if (isBranchesSuccess && isNewMode) {
      const primaryBranch = branches.find((b) => b.primary) || first(branches);
      if (primaryBranch) {
        setFieldValue('branch_id', primaryBranch.id);
      }
    }
  }, [isBranchesSuccess, setFieldValue, branches, isNewMode]);
};

export const useQuotationSubtotal = () => {
  const {
    values: { entries },
  } = useFormikContext();
  return useMemo(() => getEntriesTotal(entries), [entries]);
};

export const useQuotationTotalTaxAmount = () => {
  const { values } = useFormikContext();
  const { taxRates } = useQuotationFormContext();
  const subtotal = useQuotationSubtotal();

  return React.useMemo(() => {
    const selected = (taxRates || []).find(
      (taxRate) => taxRate.id === values.quotation_tax_rate_id,
    );
    const rate = toSafeNumber(selected?.rate);
    return (subtotal * rate) / 100;
  }, [taxRates, values.quotation_tax_rate_id, subtotal]);
};

export const useQuotationTotal = () => {
  const subtotal = useQuotationSubtotal();
  const taxAmount = useQuotationTotalTaxAmount();
  return subtotal + taxAmount;
};

export const useQuotationTotalFormatted = () => {
  const total = useQuotationTotal();
  const {
    values: { currency_code: currencyCode },
  } = useFormikContext();
  return formattedAmount(total, currencyCode);
};

export const useQuotationSubtotalFormatted = () => {
  const subtotal = useQuotationSubtotal();
  const {
    values: { currency_code: currencyCode },
  } = useFormikContext();
  return formattedAmount(subtotal, currencyCode);
};
