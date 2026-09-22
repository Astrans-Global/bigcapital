import * as ExcelJS from 'exceljs';
import * as moment from 'moment';
import { OUTSTANDING_AGING_BUCKETS } from './agingBuckets';
import { InvoiceAgingComputedRow } from './InvoiceAgingRepository';

const AGING_GROUP_LABEL =
  'Aging ( No. of Days Starting from Invoice Date)';
const HEADER_FILL = '95B3D7';
const BANNER_FILL = 'D9D9D9';
const THIN: ExcelJS.Border = {
  style: 'thin',
  color: { argb: 'FF000000' },
};
const BOX: Partial<ExcelJS.Borders> = {
  top: THIN,
  left: THIN,
  bottom: THIN,
  right: THIN,
};
const MONEY_FORMAT = '#,##0.00';

interface AgingColumn {
  key: string;
  label: string;
  width: number;
  type: 'text' | 'date' | 'days' | 'money' | 'bucket';
}

function outstandingLeafColumns(): AgingColumn[] {
  return [
    { key: 'customerName', label: 'Customer Name', width: 33, type: 'text' },
    { key: 'routeCity', label: 'Route City', width: 24, type: 'text' },
    { key: 'invoiceDate', label: 'Date of Invoice', width: 16, type: 'date' },
    { key: 'invoiceNo', label: 'Invoice Number', width: 21, type: 'text' },
    { key: 'invoiceAmount', label: 'Invoice Amount', width: 18, type: 'money' },
    { key: 'dueAmount', label: 'Due Amount', width: 19, type: 'money' },
    { key: 'daysDue', label: 'Days Due', width: 10, type: 'days' },
    ...OUTSTANDING_AGING_BUCKETS.map((bucket) => ({
      key: bucket.key,
      label: bucket.label,
      width: 14,
      type: 'bucket' as const,
    })),
    {
      key: 'totalOutstanding',
      label: 'Total Outstanding',
      width: 16,
      type: 'money' as const,
    },
  ];
}

function rdLeafColumns(): AgingColumn[] {
  return [
    { key: 'customerName', label: 'Customer Name', width: 33, type: 'text' },
    { key: 'routeCity', label: 'Route City', width: 24, type: 'text' },
    { key: 'invoiceDate', label: 'Date of Invoice', width: 16, type: 'date' },
    { key: 'invoiceNo', label: 'Invoice Number', width: 21, type: 'text' },
    { key: 'invoiceAmount', label: 'Invoice Amount', width: 18, type: 'money' },
    {
      key: 'unrealized',
      label: 'Given Unrealized/undeposited Amount',
      width: 16,
      type: 'money',
    },
    { key: 'balance', label: 'Balance Amount', width: 14, type: 'money' },
    {
      key: 'realized',
      label: 'Realised / Deposited Amount',
      width: 14,
      type: 'money',
    },
    {
      key: 'pendingCheque',
      label: 'Pending Cheque Amount',
      width: 14,
      type: 'money',
    },
    {
      key: 'undepositedCash',
      label: 'Undeposited Cash Amount',
      width: 14,
      type: 'money',
    },
    { key: 'actualDue', label: 'Actual Due', width: 14, type: 'money' },
    { key: 'daysDue', label: 'Days Due', width: 10, type: 'days' },
    ...OUTSTANDING_AGING_BUCKETS.map((bucket) => ({
      key: bucket.key,
      label: bucket.label,
      width: 14,
      type: 'bucket' as const,
    })),
    {
      key: 'totalOutstanding',
      label: 'Total Outstanding',
      width: 16,
      type: 'money' as const,
    },
  ];
}

function colLetter(index: number) {
  let n = index + 1;
  let letter = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    letter = String.fromCharCode(65 + rem) + letter;
    n = Math.floor((n - 1) / 26);
  }
  return letter;
}

function styleHeader(cell: ExcelJS.Cell, aging: boolean) {
  cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF000000' } };
  cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  cell.border = BOX;
  if (aging) {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: `FF${HEADER_FILL}` },
    };
  }
}

function rawValue(row: InvoiceAgingComputedRow, key: string) {
  if (row.buckets && row.buckets[key] != null) {
    return Number(row.buckets[key] || 0);
  }
  return (row as any)[key];
}

export async function buildInvoiceAgingWorkbook(input: {
  kind: 'outstanding' | 'rd';
  rows: InvoiceAgingComputedRow[];
  titleArea: string;
  asDate: string;
  organizationName?: string;
}): Promise<Buffer> {
  const columns =
    input.kind === 'outstanding' ? outstandingLeafColumns() : rdLeafColumns();
  const agingStart = columns.findIndex((col) => col.type === 'bucket');
  const lastIndex = columns.length - 1;
  const banner =
    input.kind === 'outstanding'
      ? `OUTSTANDING ${input.titleArea}`
      : `Daily Outstanding ${input.titleArea}`;

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(
    input.kind === 'outstanding' ? 'Outstanding' : 'RD Outstanding',
    {
      views: [{ state: 'frozen', ySplit: 3, xSplit: 1, showGridLines: true }],
      pageSetup: {
        orientation: 'landscape',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        paperSize: 9,
      },
    },
  );

  columns.forEach((col, index) => {
    sheet.getColumn(index + 1).width = col.width;
  });

  const header1 = sheet.getRow(1);
  const header2 = sheet.getRow(2);
  header1.height = 18;
  header2.height = 30;

  columns.forEach((col, index) => {
    const cell1 = header1.getCell(index + 1);
    const cell2 = header2.getCell(index + 1);
    const isAging = index >= agingStart;

    if (isAging) {
      if (index === agingStart) {
        cell1.value = AGING_GROUP_LABEL;
      }
      cell2.value = col.label;
      styleHeader(cell1, true);
      styleHeader(cell2, true);
    } else {
      cell1.value = col.label;
      styleHeader(cell1, false);
      styleHeader(cell2, false);
      sheet.mergeCells(1, index + 1, 2, index + 1);
    }
  });

  sheet.mergeCells(1, agingStart + 1, 1, lastIndex + 1);

  const bannerRow = sheet.getRow(3);
  bannerRow.height = 22;
  sheet.mergeCells(3, 1, 3, columns.length);
  const bannerCell = bannerRow.getCell(1);
  bannerCell.value = banner;
  bannerCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FF000000' } };
  bannerCell.alignment = { horizontal: 'center', vertical: 'middle' };
  bannerCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: `FF${BANNER_FILL}` },
  };
  for (let i = 1; i <= columns.length; i += 1) {
    bannerRow.getCell(i).border = BOX;
  }

  const moneyKeys = new Set(
    columns.filter((col) => col.type === 'money' || col.type === 'bucket').map((col) => col.key),
  );
  const totals: Record<string, number> = {};

  input.rows.forEach((row, rowIndex) => {
    const excelRow = sheet.getRow(4 + rowIndex);
    columns.forEach((col, index) => {
      const cell = excelRow.getCell(index + 1);
      cell.border = BOX;
      cell.font = { name: 'Calibri', size: 11 };
      const value = rawValue(row, col.key);

      if (col.type === 'date') {
        const parsed = moment(value);
        cell.value = parsed.isValid() ? parsed.toDate() : String(value || '');
        cell.numFmt = 'd-mmm-yy';
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else if (col.type === 'days') {
        cell.value = Number(value || 0);
        cell.numFmt = '0';
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else if (col.type === 'bucket') {
        const amount = Number(value || 0);
        cell.value = amount ? amount : null;
        cell.numFmt = MONEY_FORMAT;
        totals[col.key] = (totals[col.key] || 0) + amount;
      } else if (col.type === 'money') {
        const amount = Number(value || 0);
        cell.value = amount;
        cell.numFmt = MONEY_FORMAT;
        totals[col.key] = (totals[col.key] || 0) + amount;
      } else {
        cell.value = value == null ? '' : String(value);
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }
    });
  });

  const totalRow = sheet.getRow(4 + input.rows.length);
  columns.forEach((col, index) => {
    const cell = totalRow.getCell(index + 1);
    cell.border = BOX;
    cell.font = { name: 'Calibri', size: 11, bold: true };
    if (index === 0) {
      cell.value = 'Sub Total';
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    } else if (moneyKeys.has(col.key)) {
      cell.value = totals[col.key] || 0;
      cell.numFmt = MONEY_FORMAT;
    } else {
      cell.value = '';
    }
  });

  if (input.organizationName) {
    sheet.headerFooter.oddHeader = `&L${input.organizationName}&C${banner}&RAs of ${moment(
      input.asDate,
    ).format('YYYY-MM-DD')}`;
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export { AGING_GROUP_LABEL };
