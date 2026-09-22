import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { UnitOfWork } from '@/modules/Tenancy/TenancyDB/UnitOfWork.service';
import { ServiceError } from '@/modules/Items/ServiceError';
import { BankReconciliation } from '../models/BankReconciliation.model';
import { BankReconciliationLine } from '../models/BankReconciliationLine.model';
import { BankReconciliationQueryService } from '../queries/BankReconciliationQuery.service';
import { SaveBankReconciliationDraftDto } from '../dtos/BankReconciliation.dto';
import { BANK_REC_ERRORS, BANK_REC_STATUS } from '../constants';
import { money2 } from '../utils';

@Injectable()
export class SaveBankReconciliationDraftService {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly query: BankReconciliationQueryService,

    @Inject(BankReconciliation.name)
    private readonly recModel: TenantModelProxy<typeof BankReconciliation>,

    @Inject(BankReconciliationLine.name)
    private readonly lineModel: TenantModelProxy<typeof BankReconciliationLine>,
  ) {}

  async save(id: number, dto: SaveBankReconciliationDraftDto) {
    const rec = await this.query.requireRec(id);
    if (rec.status !== BANK_REC_STATUS.DRAFT) {
      throw new ServiceError(
        BANK_REC_ERRORS.REC_NOT_DRAFT,
        'Only a draft Rec can be saved.',
      );
    }

    return this.uow.withTransaction(async (trx: Knex.Transaction) => {
      if (dto.endingBalance !== undefined) {
        await this.recModel().query(trx).patchAndFetchById(id, {
          endingBalance: money2(dto.endingBalance),
        });
      }

      if (dto.lines) {
        await this.lineModel()
          .query(trx)
          .where('reconciliation_id', id)
          .delete();
        if (dto.lines.length) {
          await this.lineModel().query(trx).insert(
            dto.lines.map((line) => ({
              reconciliationId: id,
              accountTransactionId: line.accountTransactionId,
              ticked: Boolean(line.ticked),
            })),
          );
        }
      }

      return this.query.requireRec(id, trx);
    });
  }
}
