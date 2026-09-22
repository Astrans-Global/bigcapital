// @ts-nocheck
import React, { useMemo, useState } from 'react';
import moment from 'moment';
import intl from 'react-intl-universal';
import styled from 'styled-components';
import {
  NavbarGroup,
  Button,
  Classes,
  FormGroup,
  Checkbox,
} from '@blueprintjs/core';
import {
  DashboardActionsBar,
  DashboardPageContent,
  FinancialSheet,
  ReportDataTable,
  FormattedMessage as T,
} from '@/components';
import { Align, TableStyle } from '@/constants';
import { tableRowTypesToClassnames } from '@/utils';
import { useCustomerAreas } from '@/hooks/query';
import {
  useOutstandingAgingReport,
  useOutstandingAgingXlsx,
  useOutstandingAgingCsv,
  useOutstandingAgingPdf,
  useRdOutstandingAgingReport,
  useRdOutstandingAgingXlsx,
  useRdOutstandingAgingCsv,
  useRdOutstandingAgingPdf,
} from '@/hooks/query';
import { FinancialReportPage } from '../FinancialReportPage';

const AGING_LEAF_KEYS = new Set([
  'b0_30',
  'b31_60',
  'b61_80',
  'b81_90',
  'b91_120',
  'b121_150',
  'b151_270',
  'b271_360',
  'b_gt_360',
  'totalOutstanding',
]);

const MONEY_KEYS = new Set([
  'invoiceAmount',
  'dueAmount',
  'totalOutstanding',
  'unrealized',
  'balance',
  'realized',
  'pendingCheque',
  'undepositedCash',
  'actualDue',
  ...AGING_LEAF_KEYS,
]);

const COLUMN_WIDTHS = {
  customerName: 220,
  routeCity: 150,
  invoiceDate: 120,
  invoiceNo: 140,
  invoiceAmount: 130,
  dueAmount: 120,
  daysDue: 80,
  unrealized: 150,
  balance: 120,
  realized: 140,
  pendingCheque: 130,
  undepositedCash: 140,
  actualDue: 120,
  totalOutstanding: 130,
};

function cellValue(row, key) {
  const cell = (row.cells || []).find((item) => item.key === key);
  return cell?.value ?? '';
}

function leafColumn(col) {
  const isMoney = MONEY_KEYS.has(col.key);
  const isAgingLeaf = AGING_LEAF_KEYS.has(col.key);
  const isCustomer = col.key === 'customerName';

  return {
    id: col.key,
    Header: isAgingLeaf ? col.label : '',
    accessor: (row) => cellValue(row, col.key),
    width: COLUMN_WIDTHS[col.key] || 100,
    minWidth: 70,
    align: isCustomer ? Align.Left : Align.Center,
    className: isAgingLeaf ? 'aging-bucket' : isMoney ? 'aging-money' : col.key,
    disableSortBy: true,
    sticky: isCustomer ? 'left' : undefined,
    textOverview: isCustomer,
  };
}

function tableToColumns(columns) {
  return (columns || []).map((col) => {
    if (col.children?.length) {
      return {
        id: col.key,
        Header: col.label,
        className: 'aging-group',
        disableSortBy: true,
        columns: col.children.map(leafColumn),
      };
    }

    return {
      id: `${col.key}-head`,
      Header: col.label,
      className: 'identity-group',
      disableSortBy: true,
      sticky: col.key === 'customerName' ? 'left' : undefined,
      columns: [leafColumn(col)],
    };
  });
}

export function OutstandingAgingSummary() {
  return <InvoiceAgingSheet kind="outstanding" />;
}

export function RdOutstandingAgingSummary() {
  return <InvoiceAgingSheet kind="rd" />;
}

function InvoiceAgingSheet({ kind }) {
  const isRd = kind === 'rd';
  const [asDate, setAsDate] = useState(moment().format('YYYY-MM-DD'));
  const [selectedAreas, setSelectedAreas] = useState([]);
  const { data: areas } = useCustomerAreas();

  const query = useMemo(
    () => ({
      asDate,
      ...(selectedAreas.length ? { areaIds: selectedAreas } : {}),
    }),
    [asDate, selectedAreas],
  );

  const outstanding = useOutstandingAgingReport(query, { enabled: !isRd });
  const rd = useRdOutstandingAgingReport(query, { enabled: isRd });
  const reportQuery = isRd ? rd : outstanding;

  const outstandingXlsx = useOutstandingAgingXlsx(query);
  const outstandingCsv = useOutstandingAgingCsv(query);
  const outstandingPdf = useOutstandingAgingPdf(query);
  const rdXlsx = useRdOutstandingAgingXlsx(query);
  const rdCsv = useRdOutstandingAgingCsv(query);
  const rdPdf = useRdOutstandingAgingPdf(query);

  const xlsx = isRd ? rdXlsx : outstandingXlsx;
  const csv = isRd ? rdCsv : outstandingCsv;
  const pdf = isRd ? rdPdf : outstandingPdf;

  const table = reportQuery.data?.table;
  const meta = reportQuery.data?.meta;
  const columns = useMemo(() => tableToColumns(table?.columns), [table]);

  const toggleArea = (id) => {
    setSelectedAreas((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  };

  return (
    <FinancialReportPage name={isRd ? 'RD-Outstanding-Aging' : 'Outstanding-Aging'}>
      <DashboardActionsBar>
        <NavbarGroup>
          <Button
            className={Classes.MINIMAL}
            icon="refresh"
            text={<T id={'recalc_report'} />}
            onClick={() => reportQuery.refetch()}
          />
          <Button
            className={Classes.MINIMAL}
            text="Excel"
            onClick={() => xlsx.mutateAsync()}
          />
          <Button
            className={Classes.MINIMAL}
            text="CSV"
            onClick={() => csv.mutateAsync()}
          />
          <Button
            className={Classes.MINIMAL}
            text="PDF"
            onClick={() => pdf.mutateAsync()}
          />
        </NavbarGroup>
      </DashboardActionsBar>
      <DashboardPageContent>
        <div style={{ padding: '12px 16px', display: 'flex', gap: 24 }}>
          <FormGroup label={intl.get('as_date')} inline>
            <input
              type="date"
              value={asDate}
              onChange={(event) => setAsDate(event.target.value)}
            />
          </FormGroup>
          <FormGroup label={intl.get('area')} inline>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {(areas || []).map((area) => (
                <Checkbox
                  key={area.id}
                  checked={selectedAreas.includes(area.id)}
                  label={area.name}
                  onChange={() => toggleArea(area.id)}
                />
              ))}
            </div>
          </FormGroup>
        </div>
        <FinancialSheet
          companyName={meta?.organizationName}
          sheetType={
            meta?.sheetName ||
            intl.get(
              isRd
                ? 'rd_outstanding_aging_summary'
                : 'outstanding_aging_summary',
            )
          }
          dateText={meta?.formattedAsDate}
          fullWidth={true}
        >
          {meta?.banner && (
            <AgingBanner>{meta.banner}</AgingBanner>
          )}
          <InvoiceAgingDataTable
            columns={columns}
            data={table?.rows || []}
            rowClassNames={tableRowTypesToClassnames}
            noInitialFetch={true}
            sticky={true}
            styleName={TableStyle.Constrant}
          />
        </FinancialSheet>
      </DashboardPageContent>
    </FinancialReportPage>
  );
}

const AgingBanner = styled.div`
  background: #d9d9d9;
  color: #111;
  font-size: 18px;
  font-weight: 700;
  text-align: center;
  padding: 8px 12px;
  margin-bottom: 0;
  border: 1px solid #bbb;
`;

const InvoiceAgingDataTable = styled(ReportDataTable)`
  --color-table-text-color: #252a31;
  --color-table-total-text-color: #000;
  --color-table-total-border-top: #bbb;
  --aging-header: #95b3d7;

  .bp4-dark & {
    --color-table-text-color: var(--color-light-gray1);
    --color-table-total-text-color: var(--color-light-gray4);
    --color-table-total-border-top: var(--color-dark-gray5);
    --aging-header: #3d5a80;
  }

  .table {
    .thead {
      .th {
        text-align: center;
        font-weight: 600;
        font-size: 12px;
        justify-content: center;
        align-items: center;
        white-space: normal;
        line-height: 1.25;
        border-right: 1px solid var(--color-datatable-head-border);

        > div,
        .cell-inner {
          white-space: normal;
          overflow: visible;
          text-overflow: unset;
          text-align: center;
        }
      }

      .th.identity-group {
        min-height: 48px;
      }

      .th.aging-group,
      .th.aging-bucket {
        background: var(--aging-header);
        color: #111;
      }
    }

    .tbody .tr {
      .td {
        border-bottom-width: 0;
        padding-top: 0.32rem;
        padding-bottom: 0.32rem;
        font-size: 12px;
        border-right: 1px solid #ececec;
      }

      .td.aging-money,
      .td.aging-bucket {
        font-variant-numeric: tabular-nums;
      }

      &:not(.no-results) {
        .td {
          border-bottom-width: 0;
          padding-top: 0.4rem;
          padding-bottom: 0.4rem;
        }
        &:not(:first-child) .td {
          border-top: 1px solid transparent;
        }
        &.row_type--total {
          font-weight: 600;

          .td {
            border-top: 1px solid var(--color-table-total-border-top);
            border-bottom-width: 3px;
            border-bottom-style: double;
          }
        }
      }
    }
  }
`;
