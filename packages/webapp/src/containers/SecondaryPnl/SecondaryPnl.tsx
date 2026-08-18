// @ts-nocheck
import React, { useMemo, useState } from 'react';
import intl from 'react-intl-universal';
import moment from 'moment';
import styled from 'styled-components';
import {
  NavbarGroup,
  FormGroup,
  HTMLSelect,
  InputGroup,
  Classes,
} from '@blueprintjs/core';

import {
  DashboardInsider,
  DashboardPageContent,
  DashboardContentTable,
  DashboardActionsBar,
  DataTable,
  TableSkeletonRows,
  FormattedMessage as T,
} from '@/components';

import { useWarehouses, useCustomerAreas, useSecondaryPnl } from '@/hooks/query';
import { useCurrentOrganizationBaseCurrency } from '@/hooks/query';
import { formattedAmount } from '@/utils';

/**
 * Secondary P&L report filters bar -- warehouse / customer area / invoice
 * date range, see docs/ops/PHASE1.md ("Secondary P&L").
 */
function SecondaryPnlFilterBar({ filter, onFilterChange }) {
  const { data: warehouses } = useWarehouses();
  const { data: areas } = useCustomerAreas();

  const handleChange = (key) => (event) => {
    onFilterChange({ ...filter, [key]: event.target.value || undefined });
  };

  return (
    <DashboardActionsBar>
      <NavbarGroup>
        <FilterFormGroup label={intl.get('warehouse')} inline>
          <HTMLSelect
            minimal
            value={filter.warehouseId ?? ''}
            onChange={handleChange('warehouseId')}
          >
            <option value="">{intl.get('all_warehouses') || 'All'}</option>
            {(warehouses || []).map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.name}
              </option>
            ))}
          </HTMLSelect>
        </FilterFormGroup>

        <FilterFormGroup label={intl.get('area')} inline>
          <HTMLSelect
            minimal
            value={filter.areaId ?? ''}
            onChange={handleChange('areaId')}
          >
            <option value="">{intl.get('all_areas') || 'All'}</option>
            {(areas || []).map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </HTMLSelect>
        </FilterFormGroup>

        <FilterFormGroup label={intl.get('from_date') || 'From'} inline>
          <InputGroup
            type="date"
            value={filter.dateFrom ?? ''}
            onChange={handleChange('dateFrom')}
          />
        </FilterFormGroup>

        <FilterFormGroup label={intl.get('to_date') || 'To'} inline>
          <InputGroup
            type="date"
            value={filter.dateTo ?? ''}
            onChange={handleChange('dateTo')}
          />
        </FilterFormGroup>
      </NavbarGroup>
    </DashboardActionsBar>
  );
}

const FilterFormGroup = styled(FormGroup)`
  margin: 0 10px 0 0;

  .${Classes.LABEL} {
    margin-bottom: 0;
    margin-right: 6px;
    font-size: 12px;
  }
`;

/**
 * Colors profits green and losses red -- see docs/ops/PHASE1.md
 * ("Secondary P&L").
 */
function PnlAmount({ value, currencyCode }) {
  const isLoss = value < 0;
  return (
    <PnlAmountText isLoss={isLoss}>
      {formattedAmount(value, currencyCode)}
    </PnlAmountText>
  );
}

const PnlAmountText = styled.span`
  font-weight: 500;
  color: ${({ isLoss }) => (isLoss ? '#c23030' : '#1a7a3d')};
`;

function useSecondaryPnlColumns(currencyCode) {
  return useMemo(
    () => [
      {
        id: 'invoiceDate',
        Header: intl.get('invoice_date') || 'Date',
        accessor: (row) =>
          row.invoiceDate ? moment(row.invoiceDate).format('MM/DD/YYYY') : '',
        width: 100,
      },
      {
        id: 'invoiceNo',
        Header: intl.get('invoice_no') || 'Invoice No.',
        accessor: 'invoiceNo',
        width: 150,
      },
      {
        id: 'customerName',
        Header: intl.get('customer_name') || 'Customer',
        accessor: 'customerName',
        width: 180,
      },
      {
        id: 'areaName',
        Header: intl.get('area') || 'Area',
        accessor: (row) => row.areaName || '-',
        width: 130,
      },
      {
        id: 'warehouseName',
        Header: intl.get('warehouse') || 'Warehouse',
        accessor: (row) => row.warehouseName || '-',
        width: 130,
      },
      {
        id: 'invoicePnl',
        Header: intl.get('secondary_pnl') || 'Secondary P&L',
        accessor: 'invoicePnl',
        Cell: ({ row: { original } }) => (
          <PnlAmount value={original.invoicePnl} currencyCode={currencyCode} />
        ),
        align: 'right',
        width: 150,
      },
    ],
    [currencyCode],
  );
}

/**
 * Secondary P&L report table + totals footer.
 */
function SecondaryPnlTable({ filter }) {
  const currencyCode = useCurrentOrganizationBaseCurrency();
  const { data, isLoading, isFetching } = useSecondaryPnl(filter);
  const columns = useSecondaryPnlColumns(currencyCode);

  const rows = data?.rows || [];
  const totalPnl = data?.totalPnl || 0;

  return (
    <>
      <DataTable
        noInitialFetch={true}
        columns={columns}
        data={rows}
        loading={isLoading}
        headerLoading={isLoading}
        progressBarLoading={isFetching}
        expandable={false}
        sticky={true}
        TableLoadingRenderer={TableSkeletonRows}
        noResults={
          intl.get('no_delivered_invoices_found_for_this_filter') ||
          'No delivered invoices found for this filter.'
        }
      />
      <TotalFooter>
        <span>{intl.get('total_pnl') || 'Total P&L'}</span>
        <PnlAmount value={totalPnl} currencyCode={currencyCode} />
      </TotalFooter>
    </>
  );
}

const TotalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  font-size: 14px;
  font-weight: 600;
  border-top: 1px solid var(--x-border-color, rgb(210, 221, 226));

  .bp4-dark & {
    --x-border-color: rgba(255, 255, 255, 0.1);
  }
`;

/**
 * Secondary P&L report -- filterable by warehouse / customer area / invoice
 * date range, one row per Delivered invoice, green for profit and red for
 * loss, with a grand total. See docs/ops/PHASE1.md ("Secondary P&L").
 */
export function SecondaryPnl() {
  const [filter, setFilter] = useState({});

  return (
    <DashboardInsider name={'secondary-pnl'}>
      <SecondaryPnlFilterBar filter={filter} onFilterChange={setFilter} />

      <DashboardPageContent>
        <DashboardContentTable>
          <SecondaryPnlTable filter={filter} />
        </DashboardContentTable>
      </DashboardPageContent>
    </DashboardInsider>
  );
}
