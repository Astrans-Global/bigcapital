import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { UnitOfWork } from '@/modules/Tenancy/TenancyDB/UnitOfWork.service';
import { ServiceError } from '@/modules/Items/ServiceError';
import { BankReconciliation } from '../models/BankReconciliation.model';
import { BankReconciliationQueryService } from '../queries/BankReconciliationQuery.service';
import { LoadBankReconciliationLinesService } from '../queries/LoadBankReconciliationLines.service';
import { SaveBankReconciliationDraftService } from './SaveBankReconciliationDraft.service';
import { SaveBankReconciliationDraftDto } from '../dtos/BankReconciliation.dto';
import { BANK_REC_ERRORS, BANK_REC_STATUS } from '../constants';

@Injectable()
export class CloseBankReconciliationService {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly query: BankReconciliationQueryService,
    private readonly loadLines: LoadBankReconciliationLinesService,
    private readonly saveDraft: SaveBankReconciliationDraftService,

    @Inject(BankReconciliation.name)
    private readonly recModel: TenantModelProxy<typeof BankReconciliation>,
  ) {}

  async close(id: number, dto?: SaveBankReconciliationDraftDto) {
    if (dto) {
      await this.saveDraft.save(id, dto);
    }

    const rec = await this.query.requireRec(id);
    if (rec.status !== BANK_REC_STATUS.DRAFT) {
      throw new ServiceError(
        BANK_REC_ERRORS.REC_NOT_DRAFT,
        'Only a draft Rec can be closed.',
      );
    }

    await this.query.assertNoOverlappingClosed(
      rec.accountId,
      rec.startDate,
      rec.endDate,
      rec.id,
    );

    const lines = await this.loadLines.load(rec, true);
    const bankBalance = await this.query.glBalanceAt(rec.accountId, rec.endDate);
    const summary = this.query.summarize(rec, lines, bankBalance);
    if (summary.difference !== 0) {
      throw new ServiceError(
        BANK_REC_ERRORS.DIFFERENCE_NOT_ZERO,
        `Balance difference must be 0.00 before closing. Current difference is ${summary.difference.toFixed(2)}.`,
      );
    }

    return this.uow.withTransaction(async (trx: Knex.Transaction) => {
      return this.recModel().query(trx).patchAndFetchById(id, {
        status: BANK_REC_STATUS.CLOSED,
        closedAt: new Date(),
        reopenedAt: null,
      });
    });
  }
}
