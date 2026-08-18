// @ts-nocheck
import React, { useMemo, useState, useCallback } from 'react';
import intl from 'react-intl-universal';
import moment from 'moment';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import {
  NavbarGroup,
  FormGroup,
  HTMLSelect,
  InputGroup,
  Tag,
  Intent,
  Classes,
} from '@blueprintjs/core';

import {
  DashboardInsider,
  DashboardPageContent,
  DashboardContentTable,
  DashboardActionsBar,
  DataTable,
  TableSkeletonRows,
} from '@/components';

import {
  useWarehouses,
  useCustomerAreas,
  useCustomerRouteCities,
  useDeliveryPrepInvoices,
  useDeliveryPrepTotals,
} from '@/hooks/query';
import { CheckboxMultiSelectFilter } from './components';

const STATUS_LABELS = {
  pending: 'Pending',
  reserved: 'Reserved',
  invoiced: 'Invoiced',
  delivered: 'Delivered',
};
const STATUS_INTENT = {
  pending: Intent.NONE,
  reserved: Intent.PRIMARY,
  invoiced: Intent.WARNING,
  delivered: Intent.SUCCESS,
};
const STATUS_OPTIONS = [
  { value: 'pending', label: STATUS_LABELS.pending },
  { value: 'reserved', label: STATUS_LABELS.reserved },
  { value: 'invoiced', label: STATUS_LABELS.invoiced },
  { value: 'delivered', label: STATUS_LABELS.delivered },
];
const DEFAULT_FILTER = { dmsStatus: ['pending', 'reserved'] };

/**
 * Delivery Prep filter bar -- warehouse / customer area (single-pick) plus
 * route city / DMS status (tick-box, multiple), and an invoice date range.
 * See docs/ops/PHASE1.md ("Delivery Prep").
 */
function DeliveryPrepFilterBar({ filter, onFilterChange }) {
  const { data: warehouses } = useWarehouses();
  const { data: areas } = useCustomerAreas();
  const { data: routeCities } = useCustomerRouteCities(
    filter.areaId ? { areaId: filter.areaId } : undefined,
  );

  const routeCityOptions = useMemo(
    () => (routeCities || []).map((city) => ({ value: city.id, label: city.name })),
    [routeCities],
  );

  const handleWarehouseChange = (event) => {
    onFilterChange({
      ...filter,
      warehouseId: event.target.value ? Number(event.target.value) : undefined,
    });
  };

  // Route city belongs to an area -- reset the route city tick-boxes
  // whenever the area changes, same cascading behaviour as the customer
  // form's Area -> Route City dropdowns.
  const handleAreaChange = (event) => {
    onFilterChange({
      ...filter,
      areaId: event.target.value ? Number(event.target.value) : undefined,
      routeCityId: [],
    });
  };

  const handleDateChange = (key) => (event) => {
    onFilterChange({ ...filter, [key]: event.target.value || undefined });
  };

  return (
    <DashboardActionsBar>
      <NavbarGroup>
        <FilterFormGroup label={intl.get('warehouse') || 'Warehouse'} inline>
          <HTMLSelect
            minimal
            value={filter.warehouseId ?? ''}
            onChange={handleWarehouseChange}
          >
            <option value="">{intl.get('all_warehouses') || 'All'}</option>
            {(warehouses || []).map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.name}
              </option>
            ))}
          </HTMLSelect>
        </FilterFormGroup>

        <FilterFormGroup label={intl.get('area') || 'Area'} inline>
          <HTMLSelect minimal value={filter.areaId ?? ''} onChange={handleAreaChange}>
            <option value="">{intl.get('all_areas') || 'All'}</option>
            {(areas || []).map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </HTMLSelect>
        </FilterFormGroup>

        <FilterFormGroup label={intl.get('route_city') || 'Route City'} inline>
          <CheckboxMultiSelectFilter
            options={routeCityOptions}
            selectedValues={filter.routeCityId || []}
            onChange={(routeCityId) => onFilterChange({ ...filter, routeCityId })}
            allLabel={intl.get('all_route_cities') || 'All route cities'}
            emptyLabel={
              filter.areaId
                ? intl.get('no_route_cities_for_this_area') ||
                  'No route cities for this area'
                : intl.get('select_area_first') || 'Pick an area first'
            }
          />
        </FilterFormGroup>

        <FilterFormGroup label={intl.get('status') || 'Status'} inline>
          <CheckboxMultiSelectFilter
            options={STATUS_OPTIONS}
            selectedValues={filter.dmsStatus || []}
            onChange={(dmsStatus) => onFilterChange({ ...filter, dmsStatus })}
            allLabel={intl.get('all_statuses') || 'All statuses'}
          />
        </FilterFormGroup>

        <FilterFormGroup label={intl.get('from_date') || 'From'} inline>
          <InputGroup
            type="date"
            value={filter.dateFrom ?? ''}
            onChange={handleDateChange('dateFrom')}
          />
        </FilterFormGroup>

        <FilterFormGroup label={intl.get('to_date') || 'To'} inline>
          <InputGroup
            type="date"
            value={filter.dateTo ?? ''}
            onChange={handleDateChange('dateTo')}
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

function useDeliveryPrepColumns() {
  return useMemo(
    () => [
      {
        id: 'invoiceDate',
        Header: intl.get('invoice_date') || 'Date',
        accessor: (row) =>
          row.invoiceDate ? moment(row.invoiceDate).format('MM/DD/YYYY') : '',
        width: 95,
      },
      {
        id: 'invoiceNo',
        Header: intl.get('invoice_no') || 'Invoice No.',
        Cell: ({ row: { original } }) =>
          original.invoiceNo ? (
            original.invoiceNo
          ) : (
            <UnassignedHint>
              {intl.get('not_yet_assigned') || 'Not yet assigned'}
            </UnassignedHint>
          ),
        width: 160,
      },
      {
        id: 'customerName',
        Header: intl.get('customer_name') || 'Customer',
        accessor: 'customerName',
        width: 170,
      },
      {
        id: 'areaName',
        Header: intl.get('area') || 'Area',
        accessor: (row) => row.areaName || '-',
        width: 110,
      },
      {
        id: 'routeCityName',
        Header: intl.get('route_city') || 'Route City',
        accessor: (row) => row.routeCityName || '-',
        width: 120,
      },
      {
        id: 'warehouseName',
        Header: intl.get('warehouse') || 'Warehouse',
        accessor: (row) => row.warehouseName || '-',
        width: 120,
      },
      {
        id: 'dmsStatus',
        Header: intl.get('status') || 'Status',
        Cell: ({ row: { original } }) => (
          <Tag intent={STATUS_INTENT[original.dmsStatus]} minimal round>
            {STATUS_LABELS[original.dmsStatus] || original.dmsStatus}
          </Tag>
        ),
        width: 100,
      },
      {
        id: 'view',
        Header: '',
        Cell: ({ row: { original } }) => (
          <Link to={`/invoices/${original.saleInvoiceId}/edit`}>
            {intl.get('view') || 'View'}
          </Link>
        ),
        width: 60,
      },
    ],
    [],
  );
}

const UnassignedHint = styled.span`
  font-style: italic;
  opacity: 0.6;
`;

/**
 * Live totals panel for the currently-ticked invoices -- quantity per item
 * + a grand total in litres (quantity x item's pack size), see
 * docs/ops/PHASE1.md ("Delivery Prep"). Nothing here is saved; it's purely
 * a live read of whichever invoices are currently ticked.
 */
function DeliveryPrepTotalsPanel({ selectedIds }) {
  const { data, isLoading, isFetching } = useDeliveryPrepTotals(selectedIds);

  if (!selectedIds.length) {
    return (
      <TotalsPanelRoot>
        <TotalsEmptyHint>
          {intl.get('delivery_prep.totals.empty_hint') ||
            'Tick invoices above to see their combined items and litres here.'}
        </TotalsEmptyHint>
      </TotalsPanelRoot>
    );
  }

  const items = data?.items || [];
  const totalLitres = data?.totalLitres || 0;

  return (
    <TotalsPanelRoot>
      <TotalsPanelHeader>
        <span>
          {intl.get('delivery_prep.totals.title') || 'Delivery Prep totals'} (
          {selectedIds.length}{' '}
          {intl.get('delivery_prep.totals.invoices') || 'invoice(s)'})
        </span>
        {(isLoading || isFetching) && (
          <span className={Classes.TEXT_MUTED}>
            {intl.get('loading') || 'Loading...'}
          </span>
        )}
      </TotalsPanelHeader>

      <TotalsTable>
        <thead>
          <tr>
            <th>{intl.get('item') || 'Item'}</th>
            <th>{intl.get('code') || 'Code'}</th>
            <th className="align-right">{intl.get('quantity') || 'Quantity'}</th>
            <th className="align-right">{intl.get('litres') || 'Litres'}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.itemId}>
              <td>{item.itemName}</td>
              <td>{item.itemCode || '-'}</td>
              <td className="align-right">{formatNumber(item.totalQuantity)}</td>
              <td className="align-right">
                {item.totalLitres != null ? formatNumber(item.totalLitres) : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </TotalsTable>

      <TotalsFooter>
        <span>{intl.get('delivery_prep.totals.grand_total_litres') || 'Total litres'}</span>
        <strong>{formatNumber(totalLitres)}</strong>
      </TotalsFooter>
    </TotalsPanelRoot>
  );
}

const formatNumber = (value) =>
  Number(value).toLocaleString(undefined, { maximumFractionDigits: 3 });

const TotalsPanelRoot = styled.div`
  border-top: 1px solid var(--x-border-color, rgb(210, 221, 226));
  padding: 14px 20px;

  .bp4-dark & {
    --x-border-color: rgba(255, 255, 255, 0.1);
  }
`;

const TotalsEmptyHint = styled.div`
  font-size: 12px;
  opacity: 0.6;
`;

const TotalsPanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 8px;
`;

const TotalsTable = styled.table`
  width: 100%;
  max-width: 560px;
  font-size: 12px;
  border-collapse: collapse;

  th,
  td {
    padding: 4px 10px 4px 0;
    text-align: left;
  }
  th {
    opacity: 0.6;
    font-weight: 500;
  }
  .align-right {
    text-align: right;
  }
`;

const TotalsFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
  max-width: 560px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--x-border-color, rgb(210, 221, 226));
  font-size: 13px;

  .bp4-dark & {
    --x-border-color: rgba(255, 255, 255, 0.1);
  }
`;

/**
 * Delivery Prep -- Sales -> Delivery Prep. Worklist of invoices ready to be
 * loaded onto vans, filterable by warehouse / area / route city / status /
 * date, with tick-boxes to build a live totals summary (quantity per item +
 * total litres). Purely a read screen -- ticking invoices here doesn't
 * change their status or anything else. See docs/ops/PHASE1.md
 * ("Delivery Prep").
 */
export function DeliveryPrep() {
  const [filter, setFilter] = useState(DEFAULT_FILTER);
  const [selectedIds, setSelectedIds] = useState([]);
  const columns = useDeliveryPrepColumns();

  // Any filter change re-fetches a different invoice list, so any
  // previously-ticked rows no longer make sense -- clear the selection
  // (and force the table to remount below via `key`, so its internal
  // row-selection state -- which react-table tracks by row *index*, not a
  // stable id -- can't accidentally carry a tick over onto a different
  // invoice that happens to land on the same row index).
  const handleFilterChange = useCallback((nextFilter) => {
    setFilter(nextFilter);
    setSelectedIds([]);
  }, []);

  const { data: invoices, isLoading, isFetching } = useDeliveryPrepInvoices(filter);

  const handleSelectedRowsChange = useCallback((selectedFlatRows) => {
    const ids = selectedFlatRows?.map((row) => row.original.saleInvoiceId) || [];
    setSelectedIds(ids);
  }, []);

  return (
    <DashboardInsider name={'delivery-prep'}>
      <DeliveryPrepFilterBar filter={filter} onFilterChange={handleFilterChange} />

      <DashboardPageContent>
        <DashboardContentTable>
          <DataTable
            key={JSON.stringify(filter)}
            columns={columns}
            data={invoices || []}
            loading={isLoading}
            headerLoading={isLoading}
            progressBarLoading={isFetching}
            expandable={false}
            sticky={true}
            selectionColumn={true}
            onSelectedRowsChange={handleSelectedRowsChange}
            TableLoadingRenderer={TableSkeletonRows}
            noResults={
              intl.get('no_invoices_found_for_this_filter') ||
              'No invoices found for this filter.'
            }
          />
        </DashboardContentTable>

        <DeliveryPrepTotalsPanel selectedIds={selectedIds} />
      </DashboardPageContent>
    </DashboardInsider>
  );
}
