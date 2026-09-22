import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { UnitOfWork } from '@/modules/Tenancy/TenancyDB/UnitOfWork.service';
import { ServiceError } from '@/modules/Items/ServiceError';
import { BankReconciliation } from '../models/BankReconciliation.model';
import { BankReconciliationLine } from '../models/BankReconciliationLine.model';
import { BankReconciliationQueryService } from '../queries/BankReconciliationQuery.service';
import { BANK_REC_ERRORS, BANK_REC_STATUS } from '../constants';

@Injectable()
export class DeleteBankReconciliationService {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly query: BankReconciliationQueryService,

    @Inject(BankReconciliation.name)
    private readonly recModel: TenantModelProxy<typeof BankReconciliation>,

    @Inject(BankReconciliationLine.name)
    private readonly lineModel: TenantModelProxy<typeof BankReconciliationLine>,
  ) {}

  async delete(id: number) {
    const rec = await this.query.requireRec(id);
    if (rec.status !== BANK_REC_STATUS.DRAFT) {
      throw new ServiceError(
        BANK_REC_ERRORS.REC_NOT_DRAFT,
        'Only a draft Rec can be deleted.',
      );
    }

    return this.uow.withTransaction(async (trx: Knex.Transaction) => {
      await this.lineModel().query(trx).where('reconciliation_id', id).delete();
      await this.recModel().query(trx).deleteById(id);
      return { id };
    });
  }
}
