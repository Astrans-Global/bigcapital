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
import * as moment from 'moment';

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
    const sheetName =
      kind === 'outstanding'
        ? `OUTSTANDING ${titleArea}`
        : `RD OUTSTANDING ${titleArea}`;

    const columns: ITableColumn[] =
      kind === 'outstanding'
        ? this.outstandingColumns()
        : this.rdColumns();

    const tableRows: ITableRow[] = rows.map((row) => ({
      cells: columns.map((col) => ({
        key: col.key,
        value: this.cellValue(row, col.key),
      })),
    }));

    const totals = this.totalsRow(rows, columns, kind);
    tableRows.push(totals);

    const metaBase = await this.financialSheetMeta.meta();
    return {
      table: { columns, rows: tableRows },
      query,
      meta: {
        ...metaBase,
        sheetName,
        formattedAsDate: moment(asDate).format('YYYY-MM-DD'),
        formattedDateRange: moment(asDate).format('YYYY-MM-DD'),
      },
    };
  }

  public async xlsx(query: InvoiceAgingQueryDto, kind: 'outstanding' | 'rd') {
    const table = await this.table(query, kind);
    const sheet = new TableSheet(table.table);
    return sheet.convertToBuffer(sheet.convertToXLSX(), 'xlsx');
  }

  public async csv(query: InvoiceAgingQueryDto, kind: 'outstanding' | 'rd') {
    const table = await this.table(query, kind);
    return new TableSheet(table.table).convertToCSV();
  }

  public async pdf(query: InvoiceAgingQueryDto, kind: 'outstanding' | 'rd') {
    const table = await this.table(query, kind);
    return this.tableSheetPdf.convertToPdf(
      table.table,
      table.meta.organizationName,
      table.meta.sheetName,
      table.meta.formattedAsDate,
    );
  }

  private outstandingColumns(): ITableColumn[] {
    return [
      { key: 'customerName', label: 'Customer' },
      { key: 'routeCity', label: 'Route City' },
      { key: 'invoiceDate', label: 'Invoice Date' },
      { key: 'invoiceNo', label: 'Invoice Number' },
      { key: 'invoiceAmount', label: 'Invoice Amount' },
      { key: 'dueAmount', label: 'Due Amount' },
      { key: 'daysDue', label: 'Days Due' },
      ...OUTSTANDING_AGING_BUCKETS.map((bucket) => ({
        key: bucket.key,
        label: bucket.label,
      })),
      { key: 'totalOutstanding', label: 'Total Outstanding' },
    ];
  }

  private rdColumns(): ITableColumn[] {
    return [
      { key: 'customerName', label: 'Customer' },
      { key: 'routeCity', label: 'Route City' },
      { key: 'invoiceDate', label: 'Invoice Date' },
      { key: 'invoiceNo', label: 'Invoice Number' },
      { key: 'invoiceAmount', label: 'Invoice Amount' },
      { key: 'unrealized', label: 'Unrealized / Undeposited' },
      { key: 'balance', label: 'Balance' },
      { key: 'realized', label: 'Realized / Deposited' },
      { key: 'pendingCheque', label: 'Pending Cheque' },
      { key: 'undepositedCash', label: 'Undeposited Cash' },
      { key: 'actualDue', label: 'Actual Due' },
      { key: 'daysDue', label: 'Days Due' },
      ...OUTSTANDING_AGING_BUCKETS.map((bucket) => ({
        key: bucket.key,
        label: bucket.label,
      })),
      { key: 'totalOutstanding', label: 'Total' },
    ];
  }

  private cellValue(row: any, key: string) {
    if (row.buckets && row.buckets[key] != null) {
      return this.formatNumber(row.buckets[key]);
    }
    const value = row[key];
    if (typeof value === 'number') {
      return key === 'daysDue' ? String(value) : this.formatNumber(value);
    }
    return value == null ? '' : String(value);
  }

  private formatNumber(value: number) {
    if (!value) {
      return '';
    }
    return Number(value).toFixed(2);
  }

  private totalsRow(
    rows: any[],
    columns: ITableColumn[],
    kind: 'outstanding' | 'rd',
  ): ITableRow {
    const sumKeys = new Set([
      'invoiceAmount',
      'dueAmount',
      'totalOutstanding',
      'unrealized',
      'balance',
      'realized',
      'pendingCheque',
      'undepositedCash',
      'actualDue',
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
            ? 'Total'
            : sumKeys.has(col.key)
            ? this.formatNumber(totals[col.key] || 0)
            : '',
      })),
    };
  }
}
