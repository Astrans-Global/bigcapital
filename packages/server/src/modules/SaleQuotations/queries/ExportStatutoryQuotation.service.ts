import { Inject, Injectable } from '@nestjs/common';
import { SaleQuotation } from '../models/SaleQuotation';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { ChromiumlyTenancy } from '@/modules/ChromiumlyTenancy/ChromiumlyTenancy.service';
import { ServiceError } from '@/modules/Items/ServiceError';
import { ERRORS } from '../constants';
import { fillStatutoryQuotationWorkbook } from './fillStatutoryQuotationWorkbook';
import { StatutoryInvoiceFileKind } from '@/modules/SaleInvoices/queries/ExportStatutoryInvoice.service';

@Injectable()
export class ExportStatutoryQuotationService {
  constructor(
    private readonly chromiumlyTenancy: ChromiumlyTenancy,

    @Inject(SaleQuotation.name)
    private readonly saleQuotationModel: TenantModelProxy<typeof SaleQuotation>,
  ) {}

  public async export(
    quotationId: number,
    fileKind: StatutoryInvoiceFileKind,
  ): Promise<{ buffer: Buffer; filename: string; contentType: string }> {
    const quotation = await this.saleQuotationModel()
      .query()
      .findById(quotationId)
      .withGraphFetched('entries.item')
      .withGraphFetched('entries.tax');

    if (!quotation) {
      throw new ServiceError(ERRORS.SALE_QUOTATION_NOT_FOUND);
    }

    const vatRatePercent =
      Number(
        (quotation.entries || []).find((entry) => entry.taxRate)?.taxRate,
      ) || 0;

    const xlsxBuffer = await fillStatutoryQuotationWorkbook({
      quotationNo: quotation.quotationNumber,
      quotationDate: quotation.quotationDate,
      companyName: quotation.companyName,
      addressTo: quotation.addressTo,
      addressLine1: quotation.addressLine1,
      addressLine2: quotation.addressLine2,
      vatRatePercent,
      entries: quotation.entries || [],
    });

    const quotationNo = quotation.quotationNumber || `QTN_${quotation.id}`;

    if (fileKind === 'pdf') {
      const pdf = await this.chromiumlyTenancy.convertXlsxToPdf(
        xlsxBuffer,
        `${quotationNo}.xlsx`,
      );
      return {
        buffer: pdf,
        filename: `${quotationNo}_QUOTATION.pdf`,
        contentType: 'application/pdf',
      };
    }

    return {
      buffer: xlsxBuffer,
      filename: `${quotationNo}_QUOTATION.xlsx`,
      contentType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
  }
}
