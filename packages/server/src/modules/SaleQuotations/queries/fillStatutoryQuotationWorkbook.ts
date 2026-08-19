import * as path from 'path';
import * as moment from 'moment';
import * as ExcelJS from 'exceljs';
import { MAX_SALE_QUOTATION_LINES } from '../constants';

const ITEM_ROWS = [21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32];

function blank(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function formatMdY(value: Date | string | null | undefined): string {
  if (!value) return '';
  const parsed = moment(value);
  return parsed.isValid() ? parsed.format('MM/DD/YYYY') : '';
}

export interface StatutoryQuotationFillInput {
  quotationNo: string;
  quotationDate: Date | string;
  companyName?: string | null;
  addressTo?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  vatRatePercent: number;
  entries: Array<{
    rate?: number | null;
    discount?: number | null;
    item?: { code?: string | null; name?: string | null } | null;
  }>;
}

/**
 * Fill QUOTATION TEMPLATE.xlsx. Always Non-VAT style: unit price on the
 * sheet is VAT-included. Quantity is not printed. Discount cells use a
 * percentage format so the After Price formula keeps working.
 */
export async function fillStatutoryQuotationWorkbook(
  input: StatutoryQuotationFillInput,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(
    path.join(__dirname, '..', 'assets', 'quotation.xlsx'),
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

  sheet.getCell('C9').value = formatMdY(input.quotationDate);
  sheet.getCell('I9').value = blank(input.quotationNo);
  sheet.getCell('A13').value = blank(input.addressTo);
  sheet.getCell('A15').value = blank(input.companyName);
  sheet.getCell('A17').value = blank(input.addressLine1);
  sheet.getCell('A18').value = blank(input.addressLine2);

  const lines = (input.entries || []).slice(0, MAX_SALE_QUOTATION_LINES);
  const vatRatePercent = Number(input.vatRatePercent) || 0;

  ITEM_ROWS.forEach((row, index) => {
    const entry = lines[index];
    sheet.getCell(`J${row}`).value = {
      formula: `H${row}*(100%-I${row})`,
    };

    if (!entry) {
      sheet.getCell(`A${row}`).value = null;
      sheet.getCell(`D${row}`).value = null;
      sheet.getCell(`H${row}`).value = null;
      sheet.getCell(`I${row}`).value = null;
      return;
    }

    const unitPriceExcl = Number(entry.rate) || 0;
    const unitPriceIncl = unitPriceExcl * (1 + vatRatePercent / 100);
    const lineDiscountPct = Number(entry.discount) || 0;

    sheet.getCell(`A${row}`).value = blank(entry.item?.code);
    sheet.getCell(`D${row}`).value = blank(entry.item?.name);
    sheet.getCell(`H${row}`).value = unitPriceIncl;
    sheet.getCell(`H${row}`).numFmt = '#,##0.00';
    sheet.getCell(`I${row}`).value = lineDiscountPct / 100;
    sheet.getCell(`I${row}`).numFmt = '0.00%';
  });

  return Buffer.from(await workbook.xlsx.writeBuffer());
}
