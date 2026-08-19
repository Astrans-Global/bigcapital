import { Inject, Injectable } from '@nestjs/common';
import { CreditNote } from '../models/CreditNote';
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
 * Credit notes download the same VAT / Non-VAT statutory sheet as invoices,
 * with the title rewritten to TAX CREDIT NOTE / CREDIT NOTE. Due date is
 * always the credit-note date — there is no payment due.
 */
@Injectable()
export class ExportStatutoryCreditNoteService {
  constructor(
    private readonly tenancyContext: TenancyContext,
    private readonly chromiumlyTenancy: ChromiumlyTenancy,

    @Inject(CreditNote.name)
    private readonly creditNoteModel: TenantModelProxy<typeof CreditNote>,

    @Inject(Customer.name)
    private readonly customerModel: TenantModelProxy<typeof Customer>,

    @Inject(Warehouse.name)
    private readonly warehouseModel: TenantModelProxy<typeof Warehouse>,
  ) {}

  public async export(
    creditNoteId: number,
    template: StatutoryInvoiceTemplate,
    fileKind: StatutoryInvoiceFileKind,
  ): Promise<{ buffer: Buffer; filename: string; contentType: string }> {
    const creditNote = await this.creditNoteModel()
      .query()
      .findById(creditNoteId)
      .withGraphFetched('entries.item')
      .withGraphFetched('entries.tax')
      .withGraphFetched('customer')
      .withGraphFetched('warehouse');

    if (!creditNote) {
      throw new ServiceError(ERRORS.CREDIT_NOTE_NOT_FOUND);
    }
    if (!creditNote.openedAt) {
      throw new ServiceError(ERRORS.CREDIT_NOTE_NOT_OPEN);
    }
    if (!creditNote.creditNoteNumber) {
      throw new ServiceError(ERRORS.CREDIT_NOTE_NO_IS_REQUIRED);
    }

    const customer =
      creditNote.customer ||
      (await this.customerModel().query().findById(creditNote.customerId));
    const warehouse =
      creditNote.warehouse ||
      (creditNote.warehouseId
        ? await this.warehouseModel().query().findById(creditNote.warehouseId)
        : null);
    const org = await this.tenancyContext.getTenantMetadata();

    const xlsxBuffer = await fillStatutoryInvoiceWorkbook(template, {
      documentNo: creditNote.creditNoteNumber,
      documentDate: creditNote.creditNoteDate,
      dueDate: creditNote.creditNoteDate,
      documentTitle: template === 'vat' ? 'TAX CREDIT NOTE' : 'CREDIT NOTE',
      note: creditNote.note,
      referenceNo: creditNote.referenceNo,
      narration: creditNote.creditNoteMessage,
      paymentMode: null,
      discount: creditNote.discount,
      discountType: creditNote.discountType,
      entries: creditNote.entries || [],
      customer,
      warehouse,
      org,
    });

    const creditNoteNo = creditNote.creditNoteNumber;
    const label = template === 'vat' ? 'TAX_CREDIT_NOTE' : 'CREDIT_NOTE';

    if (fileKind === 'pdf') {
      const pdf = await this.chromiumlyTenancy.convertXlsxToPdf(
        xlsxBuffer,
        `${creditNoteNo}.xlsx`,
      );
      return {
        buffer: pdf,
        filename: `${creditNoteNo}_${label}.pdf`,
        contentType: 'application/pdf',
      };
    }

    return {
      buffer: xlsxBuffer,
      filename: `${creditNoteNo}_${label}.xlsx`,
      contentType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
  }
}
