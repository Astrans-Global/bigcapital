import { Injectable } from '@nestjs/common';
import { InvoiceAgingRepository } from './InvoiceAgingRepository';
import { InvoiceAgingQueryDto } from './InvoiceAgingQuery.dto';
import { TableSheet } from '../../common/TableSheet';
import { TableSheetPdf } from '../../common/TableSheetPdf';
import { FinancialSheetMeta } from '../../common/FinancialSheetMeta';
import {
  ITableColumn,
  ITableRow,
} from '../../types/Table.types';
import { OUTSTANDING_AGING_BUCKETS } from './agingBuckets';
import {
  AGING_GROUP_LABEL,
  buildInvoiceAgingWorkbook,
} from './InvoiceAgingExcel';
import * as moment from 'moment';

function flattenColumns(columns: ITableColumn[]): ITableColumn[] {
  return columns.flatMap((col) =>
    col.children?.length ? flattenColumns(col.children) : [col],
  );
}

const IDENTITY_MONEY_KEYS = new Set([
  'invoiceAmount',
  'dueAmount',
  'totalOutstanding',
  'unrealized',
  'balance',
  'realized',
  'pendingCheque',
  'undepositedCash',
  'actualDue',
]);

const AGING_PDF_CSS = `
  .sheet__table { font-size: 10px; }
  .sheet__table th {
    text-align: center;
    white-space: normal;
    background: #f4f4f4;
    font-size: 9px;
  }
  .sheet__table th.column--b0_30,
  .sheet__table th.column--b31_60,
  .sheet__table th.column--b61_80,
  .sheet__table th.column--b81_90,
  .sheet__table th.column--b91_120,
  .sheet__table th.column--b121_150,
  .sheet__table th.column--b151_270,
  .sheet__table th.column--b271_360,
  .sheet__table th.column--b_gt_360,
  .sheet__table th.column--totalOutstanding {
    background: #95B3D7;
  }
  .sheet__table td { text-align: center; }
  .sheet__table td.cell--customerName { text-align: left; }
  .row_type--total { font-weight: 700; }
`;

@Injectable()
export class InvoiceAgingService {
  constructor(
    private readonly repository: InvoiceAgingRepository,
    private readonly tableSheetPdf: TableSheetPdf,
    private readonly financialSheetMeta: FinancialSheetMeta,
  ) {}

  public async table(query: InvoiceAgingQueryDto, kind: 'outstanding' | 'rd') {
    const { rows, titleArea, asDate } = await this.repository.computeRows(
      query,
      kind,
    );
    const banner =
      kind === 'outstanding'
        ? `OUTSTANDING ${titleArea}`
        : `Daily Outstanding ${titleArea}`;
    const sheetName =
      kind === 'outstanding'
        ? 'Outstanding Aging Summary'
        : 'RD Outstanding Aging Summary';

    const columns: ITableColumn[] =
      kind === 'outstanding'
        ? this.outstandingColumns()
        : this.rdColumns();
    const leafColumns = flattenColumns(columns);

    const tableRows: ITableRow[] = rows.map((row) => ({
      cells: leafColumns.map((col) => ({
        key: col.key,
        value: this.cellValue(row, col.key),
      })),
    }));

    tableRows.push(this.totalsRow(rows, leafColumns));

    const metaBase = await this.financialSheetMeta.meta();
    return {
      table: { columns, rows: tableRows },
      query,
      meta: {
        ...metaBase,
        sheetName,
        banner,
        titleArea,
        formattedAsDate: moment(asDate).format('YYYY-MM-DD'),
        formattedDateRange: moment(asDate).format('YYYY-MM-DD'),
      },
    };
  }

  public async xlsx(query: InvoiceAgingQueryDto, kind: 'outstanding' | 'rd') {
    const { rows, titleArea, asDate } = await this.repository.computeRows(
      query,
      kind,
    );
    const metaBase = await this.financialSheetMeta.meta();
    return buildInvoiceAgingWorkbook({
      kind,
      rows,
      titleArea,
      asDate,
      organizationName: metaBase.organizationName,
    });
  }

  public async csv(query: InvoiceAgingQueryDto, kind: 'outstanding' | 'rd') {
    const table = await this.table(query, kind);
    return new TableSheet({
      columns: flattenColumns(table.table.columns),
      rows: table.table.rows,
    }).convertToCSV();
  }

  public async pdf(query: InvoiceAgingQueryDto, kind: 'outstanding' | 'rd') {
    const table = await this.table(query, kind);
    return this.tableSheetPdf.convertToPdf(
      {
        columns: flattenColumns(table.table.columns),
        rows: table.table.rows,
      },
      table.meta.organizationName,
      table.meta.banner || table.meta.sheetName,
      table.meta.formattedAsDate,
      AGING_PDF_CSS,
    );
  }

  private agingGroupColumn(): ITableColumn {
    return {
      key: 'aging',
      label: AGING_GROUP_LABEL,
      children: [
        ...OUTSTANDING_AGING_BUCKETS.map((bucket) => ({
          key: bucket.key,
          label: bucket.label,
        })),
        { key: 'totalOutstanding', label: 'Total Outstanding' },
      ],
    };
  }

  private outstandingColumns(): ITableColumn[] {
    return [
      { key: 'customerName', label: 'Customer Name' },
      { key: 'routeCity', label: 'Route City' },
      { key: 'invoiceDate', label: 'Date of Invoice' },
      { key: 'invoiceNo', label: 'Invoice Number' },
      { key: 'invoiceAmount', label: 'Invoice Amount' },
      { key: 'dueAmount', label: 'Due Amount' },
      { key: 'daysDue', label: 'Days Due' },
      this.agingGroupColumn(),
    ];
  }

  private rdColumns(): ITableColumn[] {
    return [
      { key: 'customerName', label: 'Customer Name' },
      { key: 'routeCity', label: 'Route City' },
      { key: 'invoiceDate', label: 'Date of Invoice' },
      { key: 'invoiceNo', label: 'Invoice Number' },
      { key: 'invoiceAmount', label: 'Invoice Amount' },
      { key: 'unrealized', label: 'Given Unrealized/undeposited Amount' },
      { key: 'balance', label: 'Balance Amount' },
      { key: 'realized', label: 'Realised / Deposited Amount' },
      { key: 'pendingCheque', label: 'Pending Cheque Amount' },
      { key: 'undepositedCash', label: 'Undeposited Cash Amount' },
      { key: 'actualDue', label: 'Actual Due' },
      { key: 'daysDue', label: 'Days Due' },
      this.agingGroupColumn(),
    ];
  }

  private cellValue(row: any, key: string) {
    if (row.buckets && row.buckets[key] != null) {
      return this.formatNumber(row.buckets[key], true);
    }
    const value = row[key];
    if (typeof value === 'number') {
      return key === 'daysDue'
        ? String(value)
        : this.formatNumber(value, false);
    }
    return value == null ? '' : String(value);
  }

  private formatNumber(value: number, blankIfZero = false) {
    if (!value && blankIfZero) {
      return '';
    }
    return Number(value || 0).toFixed(2);
  }

  private totalsRow(rows: any[], columns: ITableColumn[]): ITableRow {
    const sumKeys = new Set([
      ...IDENTITY_MONEY_KEYS,
      ...OUTSTANDING_AGING_BUCKETS.map((bucket) => bucket.key),
    ]);
    const totals: Record<string, number> = {};
    rows.forEach((row) => {
      sumKeys.forEach((key) => {
        const value =
          row.buckets?.[key] != null ? row.buckets[key] : Number(row[key] || 0);
        totals[key] = (totals[key] || 0) + (Number.isFinite(value) ? value : 0);
      });
    });
    return {
      rowTypes: ['total'],
      cells: columns.map((col) => ({
        key: col.key,
        value:
          col.key === 'customerName'
            ? 'Sub Total'
            : sumKeys.has(col.key)
            ? this.formatNumber(totals[col.key] || 0, false)
            : '',
      })),
    };
  }
}
