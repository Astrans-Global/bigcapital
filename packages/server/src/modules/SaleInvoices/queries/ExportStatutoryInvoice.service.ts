import { Inject, Injectable } from '@nestjs/common';
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
  fillStatutoryInvoiceWorkbook,
  StatutoryInvoiceTemplate,
} from './fillStatutoryInvoiceWorkbook';

export type { StatutoryInvoiceTemplate };
export type StatutoryInvoiceFileKind = 'xlsx' | 'pdf';

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

    const xlsxBuffer = await fillStatutoryInvoiceWorkbook(template, {
      documentNo: invoice.invoiceNo,
      documentDate: invoice.invoiceDate,
      dueDate: invoice.dueDate,
      note: invoice.note,
      referenceNo: invoice.referenceNo,
      narration: invoice.invoiceMessage,
      paymentMode: invoice.dmsPaymentMode,
      discount: invoice.discount,
      discountType: invoice.discountType,
      entries: invoice.entries || [],
      customer,
      warehouse,
      org,
    });

    const invoiceNo = invoice.invoiceNo;
    const label = template === 'vat' ? 'TAX_INVOICE' : 'SALES_INVOICE';

    if (fileKind === 'pdf') {
      const pdf = await this.chromiumlyTenancy.convertXlsxToPdf(
        xlsxBuffer,
        `${invoiceNo}.xlsx`,
      );
      return {
        buffer: pdf,
        filename: `${invoiceNo}_${label}.pdf`,
        contentType: 'application/pdf',
      };
    }

    return {
      buffer: xlsxBuffer,
      filename: `${invoiceNo}_${label}.xlsx`,
      contentType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
  }
}
