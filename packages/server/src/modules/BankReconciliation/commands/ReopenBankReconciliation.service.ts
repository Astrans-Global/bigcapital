import { Inject, Injectable } from '@nestjs/common';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { ServiceError } from '@/modules/Items/ServiceError';
import { BankReconciliation } from '../models/BankReconciliation.model';
import { BankReconciliationQueryService } from '../queries/BankReconciliationQuery.service';
import { BANK_REC_ERRORS, BANK_REC_STATUS } from '../constants';
import * as moment from 'moment';

@Injectable()
export class ReopenBankReconciliationService {
  constructor(
    private readonly query: BankReconciliationQueryService,

    @Inject(BankReconciliation.name)
    private readonly recModel: TenantModelProxy<typeof BankReconciliation>,
  ) {}

  async reopen(id: number) {
    const rec = await this.query.requireRec(id);
    if (rec.status !== BANK_REC_STATUS.CLOSED) {
      throw new ServiceError(
        BANK_REC_ERRORS.REC_NOT_CLOSED,
        'Only a closed Rec can be reopened.',
      );
    }

    const last = await this.query.lastRec(rec.accountId);
    if (!last || last.id !== rec.id) {
      throw new ServiceError(
        BANK_REC_ERRORS.CANNOT_REOPEN,
        'Reopen the later Rec for this bank first.',
      );
    }

    const draft = await this.query.draftForBank(rec.accountId);
    if (draft && draft.id !== rec.id) {
      throw new ServiceError(
        BANK_REC_ERRORS.CANNOT_REOPEN,
        'A draft Rec already exists for this bank.',
      );
    }

    return this.recModel().query().patchAndFetchById(id, {
      status: BANK_REC_STATUS.DRAFT,
      reopenedAt: moment().toMySqlDateTime(),
      closedAt: null,
    });
  }
}
