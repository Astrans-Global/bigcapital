import { Injectable } from '@nestjs/common';
import { BankReconciliationQueryService } from './BankReconciliationQuery.service';
import { BANK_REC_STATUS } from '../constants';
import { money2 } from '../utils';

@Injectable()
export class GetBankReconciliationEligibilityService {
  constructor(private readonly query: BankReconciliationQueryService) {}

  async get(accountId?: number, startDate?: string) {
    const banks = (await this.query.listBankAccounts()).map((account) => ({
      id: account.id,
      name: account.name,
      code: account.code,
    }));

    if (!accountId) {
      return { banks };
    }

    const account = await this.query.requireBank(accountId);
    const last = await this.query.lastRec(accountId);
    const lastClosed = await this.query.lastClosedRec(accountId);
    const draft = await this.query.draftForBank(accountId);
    const lockedStartDate = this.query.lockedStartDate(lastClosed);
    const effectiveStart = lockedStartDate || startDate || null;
    const beginningBalance = effectiveStart
      ? await this.query.beginningBalance(accountId, effectiveStart)
      : lastClosed
        ? money2(lastClosed.endingBalance)
        : 0;

    return {
      banks,
      account: { id: account.id, name: account.name, code: account.code },
      lastRec: last
        ? {
            id: last.id,
            periodMonth: last.periodMonth,
            startDate: last.startDate,
            endDate: last.endDate,
            status: last.status,
            endingBalance: money2(last.endingBalance),
          }
        : null,
      lastClosedRec: lastClosed
        ? {
            id: lastClosed.id,
            periodMonth: lastClosed.periodMonth,
            endDate: lastClosed.endDate,
            endingBalance: money2(lastClosed.endingBalance),
          }
        : null,
      draftId: draft?.id || null,
      lockedStartDate,
      startDate: effectiveStart,
      beginningBalance,
      canReopenLast: Boolean(
        last && last.status === BANK_REC_STATUS.CLOSED && !draft,
      ),
    };
  }
}
