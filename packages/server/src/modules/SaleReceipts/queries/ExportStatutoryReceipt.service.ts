import { Inject, Injectable } from '@nestjs/common';
import { SaleReceipt } from '../models/SaleReceipt';
import { Customer } from '@/modules/Customers/models/Customer';
import { Warehouse } from '@/modules/Warehouses/models/Warehouse.model';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { TenancyContext } from '@/modules/Tenancy/TenancyContext.service';
import { ChromiumlyTenancy } from '@/modules/ChromiumlyTenancy/ChromiumlyTenancy.service';
import { ServiceError } from '@/modules/Items/ServiceError';
import { ERRORS } from '../constants';
import {
  fillStatutoryInvoiceWorkbook,
  StatutoryInvoiceTemplate,
} from '@/modules/SaleInvoices/queries/fillStatutoryInvoiceWorkbook';
import { StatutoryInvoiceFileKind } from '@/modules/SaleInvoices/queries/ExportStatutoryInvoice.service';

/**
 * Cash sales (receipts) download the same VAT / Non-VAT statutory sheet as
 * invoices. Due date is always the receipt date — payment was taken now.
 */
@Injectable()
export class ExportStatutoryReceiptService {
  constructor(
    private readonly tenancyContext: TenancyContext,
    private readonly chromiumlyTenancy: ChromiumlyTenancy,

    @Inject(SaleReceipt.name)
    private readonly saleReceiptModel: TenantModelProxy<typeof SaleReceipt>,

    @Inject(Customer.name)
    private readonly customerModel: TenantModelProxy<typeof Customer>,

    @Inject(Warehouse.name)
    private readonly warehouseModel: TenantModelProxy<typeof Warehouse>,
  ) {}

  public async export(
    receiptId: number,
    template: StatutoryInvoiceTemplate,
    fileKind: StatutoryInvoiceFileKind,
  ): Promise<{ buffer: Buffer; filename: string; contentType: string }> {
    const receipt = await this.saleReceiptModel()
      .query()
      .findById(receiptId)
      .withGraphFetched('entries.item')
      .withGraphFetched('entries.tax')
      .withGraphFetched('customer')
      .withGraphFetched('warehouse');

    if (!receipt) {
      throw new ServiceError(ERRORS.SALE_RECEIPT_NOT_FOUND);
    }
    if (!receipt.closedAt) {
      throw new ServiceError(ERRORS.SALE_RECEIPT_NOT_CLOSED);
    }
    if (!receipt.receiptNumber) {
      throw new ServiceError(ERRORS.SALE_RECEIPT_NO_IS_REQUIRED);
    }

    const customer =
      receipt.customer ||
      (await this.customerModel().query().findById(receipt.customerId));
    const warehouse =
      receipt.warehouse ||
      (receipt.warehouseId
        ? await this.warehouseModel().query().findById(receipt.warehouseId)
        : null);
    const org = await this.tenancyContext.getTenantMetadata();

    const xlsxBuffer = await fillStatutoryInvoiceWorkbook(template, {
      documentNo: receipt.receiptNumber,
      documentDate: receipt.receiptDate,
      dueDate: receipt.receiptDate,
      note: receipt.note,
      referenceNo: receipt.referenceNo,
      narration: receipt.receiptMessage,
      paymentMode: receipt.dmsPaymentMode,
      discount: receipt.discount,
      discountType: receipt.discountType,
      entries: receipt.entries || [],
      customer,
      warehouse,
      org,
    });

    const receiptNo = receipt.receiptNumber;
    const label = template === 'vat' ? 'TAX_INVOICE' : 'SALES_INVOICE';

    if (fileKind === 'pdf') {
      const pdf = await this.chromiumlyTenancy.convertXlsxToPdf(
        xlsxBuffer,
        `${receiptNo}.xlsx`,
      );
      return {
        buffer: pdf,
        filename: `${receiptNo}_${label}.pdf`,
        contentType: 'application/pdf',
      };
    }

    return {
      buffer: xlsxBuffer,
      filename: `${receiptNo}_${label}.xlsx`,
      contentType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
  }
}
