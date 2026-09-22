import { Injectable } from '@nestjs/common';
import { BankReconciliationQueryService } from './BankReconciliationQuery.service';
import { LoadBankReconciliationLinesService } from './LoadBankReconciliationLines.service';
import { BANK_REC_STATUS } from '../constants';
import { money2 } from '../utils';

@Injectable()
export class GetBankReconciliationService {
  constructor(
    private readonly query: BankReconciliationQueryService,
    private readonly loadLines: LoadBankReconciliationLinesService,
  ) {}

  async get(id: number, hideAfterStatementDate = true) {
    const rec = await this.query.requireRec(id);
    const lines = await this.loadLines.load(rec, hideAfterStatementDate);
    const bankAccountBalance = await this.query.glBalanceAt(
      rec.accountId,
      rec.endDate,
    );
    const last = await this.query.lastRec(rec.accountId);
    const summary = this.query.summarize(rec, lines, bankAccountBalance);

    return {
      id: rec.id,
      accountId: rec.accountId,
      accountName: rec.account?.name || '',
      periodMonth: rec.periodMonth,
      startDate: rec.startDate,
      endDate: rec.endDate,
      status: rec.status,
      closedAt: rec.closedAt || null,
      reopenedAt: rec.reopenedAt || null,
      canReopen:
        rec.status === BANK_REC_STATUS.CLOSED && last?.id === rec.id,
      summary,
      deposits: lines.filter((line) => line.debit > 0),
      payments: lines.filter((line) => line.credit > 0),
      beginningBalance: money2(rec.beginningBalance),
      endingBalance: money2(rec.endingBalance),
    };
  }
}
