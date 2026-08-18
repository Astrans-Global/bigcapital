// @ts-nocheck
import React, { useMemo, useState } from 'react';
import intl from 'react-intl-universal';
import styled from 'styled-components';
import {
  NavbarGroup,
  NavbarDivider,
  FormGroup,
  HTMLSelect,
  Checkbox,
  Button,
  Alignment,
  Classes,
  Intent,
} from '@blueprintjs/core';

import {
  DashboardInsider,
  DashboardPageContent,
  DashboardContentTable,
  DashboardActionsBar,
  DataTable,
  TableSkeletonRows,
  AppToaster,
} from '@/components';

import {
  useWarehouses,
  useWarehouseInventory,
  useWarehouseInventoryXlsxExport,
} from '@/hooks/query';
import { useCurrentOrganizationBaseCurrency } from '@/hooks/query';
import { formattedAmount } from '@/utils';

const DEFAULT_FILTER = {
  hideZeroQty: false,
  includeInvoicedInFloat: false,
};

/**
 * Warehouse inventory filters -- warehouse, hide-zeros tickbox, and the
 * float-mode tickbox (whether Invoiced qty is also taken out of float).
 * See docs/ops/PHASE1.md ("Warehouse inventory").
 */
function WarehouseInventoryFilterBar({ filter, onFilterChange }) {
  const { data: warehouses } = useWarehouses();
  const { mutateAsync: exportXlsx, isPending: isExporting } =
    useWarehouseInventoryXlsxExport(filter);

  const handleWarehouseChange = (event) => {
    onFilterChange({
      ...filter,
      warehouseId: event.target.value ? Number(event.target.value) : undefined,
    });
  };

  const handleExport = async () => {
    try {
      await exportXlsx();
    } catch {
      AppToaster.show({
        message:
          intl.get('warehouse_inventory.export_failed') ||
          'Could not export the report.',
        intent: Intent.DANGER,
      });
    }
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

        <FilterFormGroup inline>
          <Checkbox
            checked={Boolean(filter.hideZeroQty)}
            label={
              intl.get('warehouse_inventory.hide_zero_qty') ||
              'Hide lots with zero stock'
            }
            onChange={(event) =>
              onFilterChange({
                ...filter,
                hideZeroQty: event.target.checked,
              })
            }
          />
        </FilterFormGroup>

        <FilterFormGroup inline>
          <Checkbox
            checked={Boolean(filter.includeInvoicedInFloat)}
            label={
              intl.get('warehouse_inventory.include_invoiced_in_float') ||
              'Float = Real − (Reserved + Invoiced)'
            }
            onChange={(event) =>
              onFilterChange({
                ...filter,
                includeInvoicedInFloat: event.target.checked,
              })
            }
          />
        </FilterFormGroup>
      </NavbarGroup>

      <NavbarGroup align={Alignment.RIGHT}>
        <NavbarDivider />
        <Button
          minimal
          icon={'export'}
          text={intl.get('export_to_excel') || 'Export to Excel'}
          loading={isExporting}
          onClick={handleExport}
        />
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

  .${Classes.CHECKBOX} {
    margin: 0;
    font-size: 12px;
  }
`;

const formatQty = (value) =>
  Number(value).toLocaleString(undefined, { maximumFractionDigits: 3 });

function useWarehouseInventoryColumns(currencyCode) {
  return useMemo(
    () => [
      {
        id: 'warehouseName',
        Header: intl.get('warehouse') || 'Warehouse',
        accessor: (row) => row.warehouseName || '-',
        width: 120,
      },
      {
        id: 'itemName',
        Header: intl.get('item') || 'Item',
        accessor: 'itemName',
        width: 160,
      },
      {
        id: 'itemCode',
        Header: intl.get('code') || 'Code',
        accessor: (row) => row.itemCode || '-',
        width: 80,
      },
      {
        id: 'listPriceExclVat',
        Header: intl.get('warehouse_inventory.list_price') || 'List (ex-VAT)',
        accessor: (row) => formattedAmount(row.listPriceExclVat, currencyCode),
        align: 'right',
        width: 110,
      },
      {
        id: 'discountPercent',
        Header: intl.get('discount') || 'Disc. %',
        accessor: (row) => `${row.discountPercent}%`,
        align: 'right',
        width: 70,
      },
      {
        id: 'vatRatePercent',
        Header: intl.get('vat') || 'VAT %',
        accessor: (row) => `${row.vatRatePercent}%`,
        align: 'right',
        width: 70,
      },
      {
        id: 'unitCostNet',
        Header: intl.get('warehouse_inventory.lot_cost') || 'Lot cost',
        accessor: (row) => formattedAmount(row.unitCostNet, currencyCode),
        align: 'right',
        width: 110,
      },
      {
        id: 'realQty',
        Header: intl.get('warehouse_inventory.real_qty') || 'Real',
        accessor: (row) => formatQty(row.realQty),
        align: 'right',
        width: 80,
      },
      {
        id: 'reservedQty',
        Header: intl.get('warehouse_inventory.reserved_qty') || 'Reserved',
        accessor: (row) => formatQty(row.reservedQty),
        align: 'right',
        width: 90,
      },
      {
        id: 'invoicedQty',
        Header: intl.get('warehouse_inventory.invoiced_qty') || 'Invoiced',
        accessor: (row) => formatQty(row.invoicedQty),
        align: 'right',
        width: 90,
      },
      {
        id: 'floatQty',
        Header: intl.get('warehouse_inventory.float_qty') || 'Float',
        accessor: (row) => formatQty(row.floatQty),
        align: 'right',
        width: 80,
      },
      {
        id: 'litres',
        Header: intl.get('litres') || 'Litres',
        accessor: (row) =>
          row.litres != null ? formatQty(row.litres) : '-',
        align: 'right',
        width: 80,
      },
      {
        id: 'value',
        Header: intl.get('warehouse_inventory.value') || 'Value',
        accessor: (row) => formattedAmount(row.value, currencyCode),
        align: 'right',
        width: 120,
      },
    ],
    [currencyCode],
  );
}

function WarehouseInventoryTable({ filter }) {
  const currencyCode = useCurrentOrganizationBaseCurrency();
  const { data, isLoading, isFetching } = useWarehouseInventory(filter);
  const columns = useWarehouseInventoryColumns(currencyCode);

  const rows = data?.rows || [];
  const totalLitres = data?.totalLitres || 0;
  const totalValue = data?.totalValue || 0;

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
          intl.get('warehouse_inventory.no_lots') ||
          'No price lots found for this filter.'
        }
      />
      <TotalFooter>
        <span>
          {intl.get('delivery_prep.totals.grand_total_litres') || 'Total litres'}
          : {formatQty(totalLitres)}
        </span>
        <span>
          {intl.get('warehouse_inventory.total_value') || 'Total value'}:{' '}
          {formattedAmount(totalValue, currencyCode)}
        </span>
      </TotalFooter>
    </>
  );
}

const TotalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 24px;
  padding: 12px 20px;
  font-size: 14px;
  font-weight: 600;
  border-top: 1px solid var(--x-border-color, rgb(210, 221, 226));

  .bp4-dark & {
    --x-border-color: rgba(255, 255, 255, 0.1);
  }
`;

/**
 * Warehouse inventory report -- one row per item price-lot. See
 * docs/ops/PHASE1.md ("Warehouse inventory").
 */
export function WarehouseInventory() {
  const [filter, setFilter] = useState(DEFAULT_FILTER);

  return (
    <DashboardInsider name={'warehouse-inventory'}>
      <WarehouseInventoryFilterBar
        filter={filter}
        onFilterChange={setFilter}
      />

      <DashboardPageContent>
        <DashboardContentTable>
          <WarehouseInventoryTable filter={filter} />
        </DashboardContentTable>
      </DashboardPageContent>
    </DashboardInsider>
  );
}
