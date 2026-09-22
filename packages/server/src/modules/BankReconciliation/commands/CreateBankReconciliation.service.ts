import { Inject, Injectable } from '@nestjs/common';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { ServiceError } from '@/modules/Items/ServiceError';
import { BankReconciliation } from '../models/BankReconciliation.model';
import { BankReconciliationQueryService } from '../queries/BankReconciliationQuery.service';
import { CreateBankReconciliationDto } from '../dtos/BankReconciliation.dto';
import { BANK_REC_ERRORS, BANK_REC_STATUS } from '../constants';
import { formatDate, money2, monthLabel } from '../utils';

@Injectable()
export class CreateBankReconciliationService {
  constructor(
    private readonly query: BankReconciliationQueryService,

    @Inject(BankReconciliation.name)
    private readonly recModel: TenantModelProxy<typeof BankReconciliation>,
  ) {}

  async create(dto: CreateBankReconciliationDto) {
    await this.query.requireBank(dto.accountId);

    const draft = await this.query.draftForBank(dto.accountId);
    if (draft) {
      return draft;
    }

    const startDate = formatDate(dto.startDate);
    const endDate = formatDate(dto.endDate);
    if (endDate < startDate) {
      throw new ServiceError(
        BANK_REC_ERRORS.START_DATE_LOCKED,
        'End date must be on or after the start date.',
      );
    }

    const lastClosed = await this.query.lastClosedRec(dto.accountId);
    const lockedStart = this.query.lockedStartDate(lastClosed);
    if (lockedStart && startDate !== lockedStart) {
      throw new ServiceError(
        BANK_REC_ERRORS.START_DATE_LOCKED,
        `Start date must be ${lockedStart} (the day after the last Rec).`,
      );
    }

    const periodMonth = dto.periodMonth || monthLabel(endDate);
    await this.query.assertMonthAllowed(dto.accountId, periodMonth);
    await this.query.assertNoOverlappingClosed(dto.accountId, startDate, endDate);

    const beginningBalance = await this.query.beginningBalance(
      dto.accountId,
      startDate,
    );

    return this.recModel().query().insertAndFetch({
      accountId: dto.accountId,
      periodMonth,
      startDate,
      endDate,
      beginningBalance,
      endingBalance: money2(dto.endingBalance),
      status: BANK_REC_STATUS.DRAFT,
    });
  }
}
