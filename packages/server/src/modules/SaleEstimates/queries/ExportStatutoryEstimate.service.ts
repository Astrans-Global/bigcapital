import { Inject, Injectable } from '@nestjs/common';
import { SaleEstimate } from '../models/SaleEstimate';
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
 * Estimates download the same VAT / Non-VAT statutory sheet as invoices.
 * Invoice number and due date print as N/A. Title is TAX ESTIMATE /
 * SALE ESTIMATE. Download is allowed as soon as the estimate is saved —
 * there is no invoice number to wait for. See docs/ops/PHASE1.md
 * ("Estimates").
 */
@Injectable()
export class ExportStatutoryEstimateService {
  constructor(
    private readonly tenancyContext: TenancyContext,
    private readonly chromiumlyTenancy: ChromiumlyTenancy,

    @Inject(SaleEstimate.name)
    private readonly saleEstimateModel: TenantModelProxy<typeof SaleEstimate>,

    @Inject(Customer.name)
    private readonly customerModel: TenantModelProxy<typeof Customer>,

    @Inject(Warehouse.name)
    private readonly warehouseModel: TenantModelProxy<typeof Warehouse>,
  ) {}

  public async export(
    estimateId: number,
    template: StatutoryInvoiceTemplate,
    fileKind: StatutoryInvoiceFileKind,
  ): Promise<{ buffer: Buffer; filename: string; contentType: string }> {
    const estimate = await this.saleEstimateModel()
      .query()
      .findById(estimateId)
      .withGraphFetched('entries.item')
      .withGraphFetched('entries.tax')
      .withGraphFetched('customer')
      .withGraphFetched('warehouse');

    if (!estimate) {
      throw new ServiceError(ERRORS.SALE_ESTIMATE_NOT_FOUND);
    }

    const customer =
      estimate.customer ||
      (await this.customerModel().query().findById(estimate.customerId));
    const warehouse =
      estimate.warehouse ||
      (estimate.warehouseId
        ? await this.warehouseModel().query().findById(estimate.warehouseId)
        : null);
    const org = await this.tenancyContext.getTenantMetadata();

    const xlsxBuffer = await fillStatutoryInvoiceWorkbook(template, {
      documentNo: 'N/A',
      documentDate: estimate.estimateDate,
      dueDate: estimate.estimateDate,
      dueDateLabel: 'N/A',
      documentTitle: template === 'vat' ? 'TAX ESTIMATE' : 'SALE ESTIMATE',
      note: estimate.note,
      referenceNo: estimate.reference,
      narration: null,
      paymentMode: null,
      discount: estimate.discount,
      discountType: estimate.discountType,
      entries: estimate.entries || [],
      customer,
      warehouse,
      org,
    });

    const estimateNo = estimate.estimateNumber || `ESTIMATE_${estimate.id}`;
    const label = template === 'vat' ? 'TAX_ESTIMATE' : 'SALE_ESTIMATE';

    if (fileKind === 'pdf') {
      const pdf = await this.chromiumlyTenancy.convertXlsxToPdf(
        xlsxBuffer,
        `${estimateNo}.xlsx`,
      );
      return {
        buffer: pdf,
        filename: `${estimateNo}_${label}.pdf`,
        contentType: 'application/pdf',
      };
    }

    return {
      buffer: xlsxBuffer,
      filename: `${estimateNo}_${label}.xlsx`,
      contentType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
  }
}
