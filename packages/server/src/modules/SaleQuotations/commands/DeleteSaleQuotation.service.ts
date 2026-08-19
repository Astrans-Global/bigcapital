import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { SaleQuotation } from '../models/SaleQuotation';
import { ItemEntry } from '@/modules/TransactionItemEntry/models/ItemEntry';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { UnitOfWork } from '@/modules/Tenancy/TenancyDB/UnitOfWork.service';
import { ServiceError } from '@/modules/Items/ServiceError';
import { ERRORS } from '../constants';

@Injectable()
export class DeleteSaleQuotation {
  constructor(
    @Inject(SaleQuotation.name)
    private readonly saleQuotationModel: TenantModelProxy<typeof SaleQuotation>,

    @Inject(ItemEntry.name)
    private readonly itemEntryModel: TenantModelProxy<typeof ItemEntry>,

    private readonly uow: UnitOfWork,
  ) {}

  public async deleteQuotation(quotationId: number): Promise<void> {
    const old = await this.saleQuotationModel().query().findById(quotationId);
    if (!old) {
      throw new ServiceError(ERRORS.SALE_QUOTATION_NOT_FOUND);
    }

    return this.uow.withTransaction(async (trx: Knex.Transaction) => {
      await this.itemEntryModel()
        .query(trx)
        .where('reference_id', quotationId)
        .where('reference_type', 'SaleQuotation')
        .delete();

      await this.saleQuotationModel().query(trx).where('id', quotationId).delete();
    });
  }
}
