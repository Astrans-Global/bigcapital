import { Inject, Injectable } from '@nestjs/common';
import * as path from 'path';
import * as moment from 'moment';
import * as ExcelJS from 'exceljs';
import { SaleInvoice } from '../models/SaleInvoice';
import { Customer } from '@/modules/Customers/models/Customer';
import { Warehouse } from '@/modules/Warehouses/models/Warehouse.model';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { TenancyContext } from '@/modules/Tenancy/TenancyContext.service';
import { ChromiumlyTenancy } from '@/modules/ChromiumlyTenancy/ChromiumlyTenancy.service';
import { CommandSaleInvoiceValidators } from '../commands/CommandSaleInvoiceValidators.service';
import { ServiceError } from '@/modules/Items/ServiceError';
import { ERRORS } from '../constants';
import {
  computeSaleInvoiceVatAfterDiscount,
  formatVatRateLabel,
  MAX_SALE_INVOICE_LINES,
} from '../ComputeSaleInvoiceVat';

export type StatutoryInvoiceTemplate = 'vat' | 'non_vat';
export type StatutoryInvoiceFileKind = 'xlsx' | 'pdf';

const ITEM_ROWS = [22, 23, 24, 25, 26, 27, 28, 29, 30];

function blank(value: unknown): string {
  if (value === null || value === undefined) return '';
  const text = String(value).trim();
  return text;
}

function formatMdY(value: Date | string | null | undefined): string {
  if (!value) return '';
  const parsed = moment(value);
  return parsed.isValid() ? parsed.format('MM/DD/YYYY') : '';
}

function joinAddressLine3(parts: Array<string | null | undefined>): string {
  return parts.map((part) => blank(part)).filter(Boolean).join(', ');
}

@Injectable()
export class ExportStatutoryInvoiceService {
  constructor(
    private readonly tenancyContext: TenancyContext,
    private readonly chromiumlyTenancy: ChromiumlyTenancy,
    private readonly validators: CommandSaleInvoiceValidators,

    @Inject(SaleInvoice.name)
    private readonly saleInvoiceModel: TenantModelProxy<typeof SaleInvoice>,

    @Inject(Customer.name)
    private readonly customerModel: TenantModelProxy<typeof Customer>,

    @Inject(Warehouse.name)
    private readonly warehouseModel: TenantModelProxy<typeof Warehouse>,
  ) {}

  public async export(
    invoiceId: number,
    template: StatutoryInvoiceTemplate,
    fileKind: StatutoryInvoiceFileKind,
  ): Promise<{ buffer: Buffer; filename: string; contentType: string }> {
    const xlsx = await this.buildXlsx(invoiceId, template);
    const invoiceNo = xlsx.invoiceNo;
    const label = template === 'vat' ? 'TAX_INVOICE' : 'SALES_INVOICE';

    if (fileKind === 'pdf') {
      const pdf = await this.chromiumlyTenancy.convertXlsxToPdf(
        xlsx.buffer,
        `${invoiceNo}.xlsx`,
      );
      return {
        buffer: pdf,
        filename: `${invoiceNo}_${label}.pdf`,
        contentType: 'application/pdf',
      };
    }

    return {
      buffer: xlsx.buffer,
      filename: `${invoiceNo}_${label}.xlsx`,
      contentType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
  }

  private async buildXlsx(
    invoiceId: number,
    template: StatutoryInvoiceTemplate,
  ): Promise<{ buffer: Buffer; invoiceNo: string }> {
    const invoice = await this.saleInvoiceModel()
      .query()
      .findById(invoiceId)
      .withGraphFetched('entries.item')
      .withGraphFetched('entries.tax')
      .withGraphFetched('customer')
      .withGraphFetched('warehouse');

    this.validators.validateInvoiceExistance(invoice);

    const status = invoice.dmsStatus || 'pending';
    if (status !== 'invoiced' && status !== 'delivered') {
      throw new ServiceError(ERRORS.INVOICE_NOT_READY_TO_DOWNLOAD);
    }
    if (!invoice.invoiceNo) {
      throw new ServiceError(ERRORS.INVOICE_HAS_NO_NUMBER);
    }

    const customer =
      invoice.customer ||
      (await this.customerModel().query().findById(invoice.customerId));
    const warehouse =
      invoice.warehouse ||
      (invoice.warehouseId
        ? await this.warehouseModel().query().findById(invoice.warehouseId)
        : null);
    const org = await this.tenancyContext.getTenantMetadata();
    const orgAddress = (org?.address || {}) as Record<string, string>;

    const taxedEntry = (invoice.entries || []).find(
      (entry) => entry.taxRate || (entry as any).tax?.rate,
    );
    const vatRatePercent =
      Number(taxedEntry?.taxRate || (taxedEntry as any)?.tax?.rate) || 0;
    const vat = computeSaleInvoiceVatAfterDiscount({
      entries: invoice.entries || [],
      discount: invoice.discount,
      discountType: invoice.discountType,
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
      printGridlines: false,
    };

    const invoiceDate = formatMdY(invoice.invoiceDate);
    const dueDate = formatMdY(invoice.dueDate);

    sheet.getCell('F5').value = invoiceDate;
    sheet.getCell('V5').value = invoice.invoiceNo;
    sheet.getCell('F7').value = blank(org?.taxNumber);
    sheet.getCell('F8').value = blank(org?.name);
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
      sheet.getCell('V7').value = blank(customer?.tinNumber);
    }

    sheet.getCell('V8').value = blank(customer?.companyName);
    sheet.getCell('V9').value = blank(customer?.shippingAddress1);
    sheet.getCell('V10').value = blank(customer?.shippingAddress2);
    sheet.getCell('V11').value = blank(customer?.shippingAddress3);
    sheet.getCell('V12').value = blank(customer?.workPhone);
    sheet.getCell('V14').value = blank(warehouse?.name);

    sheet.getCell('J16').value = blank(invoice.note);
    sheet.getCell('J17').value = blank(invoice.referenceNo);
    sheet.getCell('J18').value = dueDate;
    sheet.getCell('J19').value = blank(invoice.invoiceMessage);

    const lines = (invoice.entries || []).slice(0, MAX_SALE_INVOICE_LINES);
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
      invoice.discountType === 'amount'
        ? vat.subtotal > 0
          ? vat.discountAmount / vat.subtotal
          : 0
        : (Number(invoice.discount) || 0) / 100;
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
    sheet.getCell(paymentCell).value = blank(invoice.dmsPaymentMode);

    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
    return { buffer, invoiceNo: invoice.invoiceNo };
  }
}
