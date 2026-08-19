import * as path from 'path';
import * as moment from 'moment';
import * as ExcelJS from 'exceljs';
import {
  computeSaleInvoiceVatAfterDiscount,
  formatVatRateLabel,
  MAX_SALE_INVOICE_LINES,
} from '../ComputeSaleInvoiceVat';

export type StatutoryInvoiceTemplate = 'vat' | 'non_vat';

const ITEM_ROWS = [22, 23, 24, 25, 26, 27, 28, 29, 30];

function blank(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function formatMdY(value: Date | string | null | undefined): string {
  if (!value) return '';
  const parsed = moment(value);
  return parsed.isValid() ? parsed.format('MM/DD/YYYY') : '';
}

function joinAddressLine3(parts: Array<string | null | undefined>): string {
  return parts.map((part) => blank(part)).filter(Boolean).join(', ');
}

export interface StatutoryInvoiceFillInput {
  documentNo: string;
  documentDate: Date | string;
  dueDate: Date | string;
  note?: string | null;
  referenceNo?: string | null;
  narration?: string | null;
  paymentMode?: string | null;
  documentTitle?: string | null;
  discount?: number | null;
  discountType?: string | null;
  entries: Array<{
    rate?: number | null;
    quantity?: number | null;
    discount?: number | null;
    discountType?: string | null;
    taxRate?: number | null;
    tax?: { rate?: number | null } | null;
    item?: { code?: string | null; name?: string | null } | null;
  }>;
  customer?: {
    tinNumber?: string | null;
    companyName?: string | null;
    shippingAddress1?: string | null;
    shippingAddress2?: string | null;
    shippingAddress3?: string | null;
    workPhone?: string | null;
  } | null;
  warehouse?: { name?: string | null } | null;
  org?: {
    taxNumber?: string | null;
    name?: string | null;
    address?: Record<string, string> | null;
  } | null;
}

export async function fillStatutoryInvoiceWorkbook(
  template: StatutoryInvoiceTemplate,
  input: StatutoryInvoiceFillInput,
): Promise<Buffer> {
  const orgAddress = (input.org?.address || {}) as Record<string, string>;
  const taxedEntry = (input.entries || []).find(
    (entry) => entry.taxRate || entry.tax?.rate,
  );
  const vatRatePercent =
    Number(taxedEntry?.taxRate || taxedEntry?.tax?.rate) || 0;
  const vat = computeSaleInvoiceVatAfterDiscount({
    entries: input.entries || [],
    discount: input.discount,
    discountType: input.discountType,
    vatRatePercent,
  });

  const workbook = new ExcelJS.Workbook();
  const templateFile =
    template === 'vat' ? 'vat-invoice.xlsx' : 'non-vat-invoice.xlsx';
  await workbook.xlsx.readFile(
    path.join(__dirname, '..', 'assets', templateFile),
  );
  const sheet = workbook.worksheets[0];

  sheet.views = [{ showGridLines: false }];
  sheet.pageSetup = {
    ...sheet.pageSetup,
    orientation: 'landscape',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 1,
    paperSize: 9,
  };

  const invoiceDate = formatMdY(input.documentDate);
  const dueDate = formatMdY(input.dueDate);

  if (input.documentTitle) {
    sheet.getCell('A3').value = input.documentTitle;
  }

  sheet.getCell('F5').value = invoiceDate;
  sheet.getCell('V5').value = input.documentNo;
  sheet.getCell('F7').value = blank(input.org?.taxNumber);
  sheet.getCell('F8').value = blank(input.org?.name);
  sheet.getCell('F9').value = blank(orgAddress.address1);
  sheet.getCell('F10').value = blank(orgAddress.address2);
  sheet.getCell('F11').value = joinAddressLine3([
    orgAddress.city,
    orgAddress.stateProvince,
    orgAddress.postalCode,
  ]);
  sheet.getCell('F12').value = blank(orgAddress.phone);
  sheet.getCell('F14').value = invoiceDate;

  if (template === 'vat') {
    sheet.getCell('V7').value = blank(input.customer?.tinNumber);
  }

  sheet.getCell('V8').value = blank(input.customer?.companyName);
  sheet.getCell('V9').value = blank(input.customer?.shippingAddress1);
  sheet.getCell('V10').value = blank(input.customer?.shippingAddress2);
  sheet.getCell('V11').value = blank(input.customer?.shippingAddress3);
  sheet.getCell('V12').value = blank(input.customer?.workPhone);
  sheet.getCell('V14').value = blank(input.warehouse?.name);

  sheet.getCell('J16').value = blank(input.note);
  sheet.getCell('J17').value = blank(input.referenceNo);
  sheet.getCell('J18').value = dueDate;
  sheet.getCell('J19').value = blank(input.narration);

  const lines = (input.entries || []).slice(0, MAX_SALE_INVOICE_LINES);
  ITEM_ROWS.forEach((row, index) => {
    const entry = lines[index];
    sheet.getCell(`V${row}`).value = {
      formula: `P${row}*(100%-S${row})`,
    };
    sheet.getCell(`X${row}`).value = { formula: `O${row}*V${row}` };

    if (!entry) {
      sheet.getCell(`A${row}`).value = null;
      sheet.getCell(`D${row}`).value = null;
      sheet.getCell(`O${row}`).value = null;
      sheet.getCell(`P${row}`).value = null;
      sheet.getCell(`S${row}`).value = null;
      return;
    }

    const unitPriceExcl = Number(entry.rate) || 0;
    const unitPrice =
      template === 'vat'
        ? unitPriceExcl
        : unitPriceExcl * (1 + vatRatePercent / 100);
    const lineDiscountPct = Number(entry.discount) || 0;

    sheet.getCell(`A${row}`).value = blank(entry.item?.code);
    sheet.getCell(`D${row}`).value = blank(entry.item?.name);
    sheet.getCell(`O${row}`).value = Number(entry.quantity) || 0;
    sheet.getCell(`P${row}`).value = unitPrice;
    sheet.getCell(`P${row}`).numFmt = '#,##0.00';
    sheet.getCell(`S${row}`).value = lineDiscountPct / 100;
    sheet.getCell(`S${row}`).numFmt = '0.00%';
  });

  const headerDiscountPct =
    input.discountType === 'amount'
      ? vat.subtotal > 0
        ? vat.discountAmount / vat.subtotal
        : 0
      : (Number(input.discount) || 0) / 100;
  sheet.getCell('U32').value = headerDiscountPct;
  sheet.getCell('U32').numFmt = '0.00%';

  if (template === 'vat') {
    const rateLabel = formatVatRateLabel(vatRatePercent);
    sheet.getCell('A34').value =
      `VAT Amount (Total Value of Supply @${rateLabel}%)`;
    sheet.getCell('X34').value = {
      formula: `X33*${vatRatePercent}%`,
    };
  }

  const paymentCell = template === 'vat' ? 'H38' : 'H36';
  sheet.getCell(paymentCell).value = blank(input.paymentMode);

  return Buffer.from(await workbook.xlsx.writeBuffer());
}
