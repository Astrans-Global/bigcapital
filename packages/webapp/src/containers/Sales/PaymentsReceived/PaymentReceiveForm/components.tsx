// @ts-nocheck
import React, { useLayoutEffect } from 'react';
import moment from 'moment';
import intl from 'react-intl-universal';
import { Button } from '@blueprintjs/core';
import { useFormikContext } from 'formik';
import * as R from 'ramda';

import { Money, ExchangeRateInputGroup, MoneyFieldCell } from '@/components';

import { useCurrentOrganizationBaseCurrency, useCustomerAreas } from '@/hooks/query';
import { useEstimateIsForeignCustomer } from './utils';
import { withSettings } from '@/containers/Settings/withSettings';
import { usePaymentReceiveFormContext } from './PaymentReceiveFormProvider';
import { previewCollectionNumber } from './collectionNumber';

/**
 * Invoice date cell.
 */
function InvoiceDateCell({ value }) {
  return <span>{moment(value).format('YYYY MMM DD')}</span>;
}

/**
 * Invoice number table cell accessor.
 */
function InvNumberCellAccessor(row) {
  return row?.invoice_no ? `#${row?.invoice_no || ''}` : '-';
}

/**
 * Mobey table cell.
 */
function MoneyTableCell({ row: { original }, value }) {
  return <Money amount={value} currency={original.currency_code} />;
}

/**
 * Retrieve payment receive form entries columns.
 */
export const usePaymentReceiveEntriesColumns = () => {
  return React.useMemo(
    () => [
      {
        Header: 'Invoice date',
        id: 'invoice_date',
        accessor: 'invoice_date',
        Cell: InvoiceDateCell,
        disableSortBy: true,
        disableResizing: true,
        width: 250,
        className: 'date',
      },
      {
        Header: intl.get('invocie_number'),
        accessor: InvNumberCellAccessor,
        disableSortBy: true,
        className: 'invoice_number',
      },
      {
        Header: intl.get('invoice_amount'),
        accessor: 'amount',
        Cell: MoneyTableCell,
        disableSortBy: true,
        width: 100,
        className: 'invoice_amount',
      },
      {
        Header: intl.get('amount_due'),
        accessor: 'due_amount',
        Cell: MoneyTableCell,
        disableSortBy: true,
        width: 150,
        className: 'amount_due',
      },
      {
        Header: intl.get('payment_amount'),
        accessor: 'payment_amount',
        Cell: MoneyFieldCell,
        disableSortBy: true,
        width: 150,
        className: 'payment_amount',
      },
    ],
    [],
  );
};

/**
 * payment receive exchange rate input field.
 * @returns {JSX.Element}
 */
export function PaymentReceiveExchangeRateInputField({ ...props }) {
  const baseCurrency = useCurrentOrganizationBaseCurrency();
  const { values } = useFormikContext();

  const isForeignCustomer = useEstimateIsForeignCustomer();

  // Can't continue if the customer is not foreign.
  if (!isForeignCustomer) {
    return null;
  }
  return (
    <ExchangeRateInputGroup
      fromCurrency={values.currency_code}
      toCurrency={baseCurrency}
      {...props}
    />
  );
}

/**
 * payment receive project select.
 * @returns {JSX.Element}
 */
export function PaymentReceiveProjectSelectButton({ label }) {
  return <Button text={label ?? intl.get('select_project')} />;
}

/**
 * Syncs the auto-increment settings to payment receive form.
 * @returns {React.ReactNode}
 */
export const PaymentReceiveSyncIncrementSettingsToForm = R.compose(
  withSettings(
    ({
      allSettings,
      paymentReceivesCashSettings,
      paymentReceivesBankTransferSettings,
      paymentReceivesBankDepositSettings,
    }) => ({
      allSettings,
      cashNumberSettings: paymentReceivesCashSettings,
      bankTransferNumberSettings: paymentReceivesBankTransferSettings,
      bankDepositNumberSettings: paymentReceivesBankDepositSettings,
    }),
  ),
)(({
  allSettings,
  cashNumberSettings,
  bankTransferNumberSettings,
  bankDepositNumberSettings,
}) => {
  const { setFieldValue, values } = useFormikContext();
  const { isNewMode } = usePaymentReceiveFormContext();
  const { data: areas } = useCustomerAreas();
  const area = (areas || []).find(
    (item) => String(item.id) === String(values.area_id),
  );
  const letter = area?.name
    ? String(area.name).match(/[A-Za-z]/)?.[0]?.toUpperCase()
    : '';
  const chequeSettings = letter
    ? allSettings?.[`pdCheques${letter}`]
    : undefined;
  const settingsByMethod = {
    cash: cashNumberSettings,
    bank_transfer: bankTransferNumberSettings,
    bank_deposit: bankDepositNumberSettings,
    pd_cheque: chequeSettings,
  };

  useLayoutEffect(() => {
    if (!isNewMode || !values.payment_method) return;

    setFieldValue(
      'payment_receive_no',
      previewCollectionNumber(
        values.payment_method,
        settingsByMethod[values.payment_method],
        { areaName: area?.name },
      ),
    );
  }, [
    isNewMode,
    setFieldValue,
    values.payment_method,
    values.area_id,
    area?.name,
    cashNumberSettings,
    bankTransferNumberSettings,
    bankDepositNumberSettings,
    chequeSettings,
  ]);
  return null;
});
