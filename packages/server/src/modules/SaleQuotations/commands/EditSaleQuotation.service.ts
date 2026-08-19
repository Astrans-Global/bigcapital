import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { SaleQuotation } from '../models/SaleQuotation';
import { EditSaleQuotationDto } from '../dtos/SaleQuotation.dto';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { UnitOfWork } from '@/modules/Tenancy/TenancyDB/UnitOfWork.service';
import { ItemsEntriesService } from '@/modules/Items/ItemsEntries.service';
import { ItemEntry } from '@/modules/TransactionItemEntry/models/ItemEntry';
import { ServiceError } from '@/modules/Items/ServiceError';
import { ERRORS } from '../constants';
import { CreateSaleQuotation } from './CreateSaleQuotation.service';

@Injectable()
export class EditSaleQuotation {
  constructor(
    @Inject(SaleQuotation.name)
    private readonly saleQuotationModel: TenantModelProxy<typeof SaleQuotation>,

    @Inject(ItemEntry.name)
    private readonly itemEntryModel: TenantModelProxy<typeof ItemEntry>,

    private readonly itemsEntriesService: ItemsEntriesService,
    private readonly createSaleQuotation: CreateSaleQuotation,
    private readonly uow: UnitOfWork,
  ) {}

  public async editQuotation(
    quotationId: number,
    dto: EditSaleQuotationDto,
  ): Promise<SaleQuotation> {
    const old = await this.saleQuotationModel().query().findById(quotationId);
    if (!old) {
      throw new ServiceError(ERRORS.SALE_QUOTATION_NOT_FOUND);
    }

    await this.itemsEntriesService.validateItemsIdsExistance(dto.entries);
    await this.itemsEntriesService.validateNonSellableEntriesItems(dto.entries);

    return this.uow.withTransaction(async (trx: Knex.Transaction) => {
      await this.itemEntryModel()
        .query(trx)
        .where('reference_id', quotationId)
        .where('reference_type', 'SaleQuotation')
        .delete();

      const model = await this.createSaleQuotation.toModel(
        dto,
        old.quotationNumber,
      );
      return this.saleQuotationModel()
        .query(trx)
        .upsertGraphAndFetch({
          id: quotationId,
          ...model,
        });
    });
  }
}
