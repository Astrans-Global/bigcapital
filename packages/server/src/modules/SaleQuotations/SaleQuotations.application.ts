import { Injectable } from '@nestjs/common';
import { CreateSaleQuotation } from './commands/CreateSaleQuotation.service';
import { EditSaleQuotation } from './commands/EditSaleQuotation.service';
import { DeleteSaleQuotation } from './commands/DeleteSaleQuotation.service';
import { GetSaleQuotation } from './queries/GetSaleQuotation.service';
import { GetSaleQuotationsService } from './queries/GetSaleQuotations.service';
import { ExportStatutoryQuotationService } from './queries/ExportStatutoryQuotation.service';
import {
  CreateSaleQuotationDto,
  EditSaleQuotationDto,
} from './dtos/SaleQuotation.dto';
import { StatutoryInvoiceFileKind } from '@/modules/SaleInvoices/queries/ExportStatutoryInvoice.service';

@Injectable()
export class SaleQuotationsApplication {
  constructor(
    private readonly createSaleQuotation: CreateSaleQuotation,
    private readonly editSaleQuotation: EditSaleQuotation,
    private readonly deleteSaleQuotation: DeleteSaleQuotation,
    private readonly getSaleQuotation: GetSaleQuotation,
    private readonly getSaleQuotationsService: GetSaleQuotationsService,
    private readonly exportStatutoryQuotationService: ExportStatutoryQuotationService,
  ) {}

  createQuotation(dto: CreateSaleQuotationDto) {
    return this.createSaleQuotation.createQuotation(dto);
  }

  editQuotation(quotationId: number, dto: EditSaleQuotationDto) {
    return this.editSaleQuotation.editQuotation(quotationId, dto);
  }

  deleteQuotation(quotationId: number) {
    return this.deleteSaleQuotation.deleteQuotation(quotationId);
  }

  getQuotation(quotationId: number) {
    return this.getSaleQuotation.getQuotation(quotationId);
  }

  getQuotations(page?: number, pageSize?: number) {
    return this.getSaleQuotationsService.getQuotations(page, pageSize);
  }

  exportStatutoryQuotation(
    quotationId: number,
    fileKind: StatutoryInvoiceFileKind,
  ) {
    return this.exportStatutoryQuotationService.export(quotationId, fileKind);
  }
}
