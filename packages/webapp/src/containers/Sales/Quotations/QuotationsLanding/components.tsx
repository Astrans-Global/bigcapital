// @ts-nocheck
import React from 'react';
import { Intent, Menu, MenuItem, MenuDivider } from '@blueprintjs/core';
import clsx from 'classnames';
import { SaleEstimateAction, AbilitySubject } from '@/constants/abilityOption';
import { CLASSES } from '@/constants/classes';
import {
  FormatDateCell,
  Money,
  Icon,
  Can,
} from '@/components';
import { safeCallback } from '@/utils';

function AmountAccessor({ amount, currency_code, currencyCode }) {
  return <Money amount={amount} currency={currency_code || currencyCode} />;
}

export function ActionsMenu({
  row: { original },
  payload: { onEdit, onDelete },
}) {
  return (
    <Menu>
      <Can I={SaleEstimateAction.Edit} a={AbilitySubject.Estimate}>
        <MenuItem
          icon={<Icon icon="pen-18" />}
          text="Edit quotation"
          onClick={safeCallback(onEdit, original)}
        />
      </Can>
      <Can I={SaleEstimateAction.Delete} a={AbilitySubject.Estimate}>
        <MenuDivider />
        <MenuItem
          text="Delete quotation"
          intent={Intent.DANGER}
          onClick={safeCallback(onDelete, original)}
          icon={<Icon icon="trash-16" iconSize={16} />}
        />
      </Can>
    </Menu>
  );
}

export function useQuotationsTableColumns() {
  return React.useMemo(
    () => [
      {
        id: 'quotation_number',
        Header: 'Quotation #',
        accessor: (row) => row.quotation_number || row.quotationNumber,
        width: 140,
        className: 'quotation_number',
        clickable: true,
        textOverview: true,
      },
      {
        id: 'quotation_date',
        Header: 'Date',
        accessor: (row) => row.quotation_date || row.quotationDate,
        Cell: FormatDateCell,
        width: 140,
        className: 'quotation_date',
        clickable: true,
        textOverview: true,
      },
      {
        id: 'company_name',
        Header: 'Company Name',
        accessor: (row) => row.company_name || row.companyName,
        width: 220,
        className: 'company_name',
        clickable: true,
        textOverview: true,
      },
      {
        id: 'amount',
        Header: 'Amount',
        accessor: AmountAccessor,
        width: 140,
        align: 'right',
        clickable: true,
        className: clsx(CLASSES.FONT_BOLD),
        money: true,
      },
    ],
    [],
  );
}
