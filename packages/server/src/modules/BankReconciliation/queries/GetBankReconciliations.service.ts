import { Inject, Injectable } from '@nestjs/common';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { BankReconciliation } from '../models/BankReconciliation.model';
import { BankReconciliationQueryService } from './BankReconciliationQuery.service';
import { LoadBankReconciliationLinesService } from './LoadBankReconciliationLines.service';
import { money2 } from '../utils';

@Injectable()
export class GetBankReconciliationsService {
  constructor(
    private readonly query: BankReconciliationQueryService,
    private readonly loadLines: LoadBankReconciliationLinesService,

    @Inject(BankReconciliation.name)
    private readonly recModel: TenantModelProxy<typeof BankReconciliation>,
  ) {}

  async list(accountId?: number) {
    const builder = this.recModel()
      .query()
      .withGraphFetched('account')
      .withGraphFetched('lines')
      .orderBy('end_date', 'DESC')
      .orderBy('id', 'DESC');
    if (accountId) {
      builder.where('account_id', accountId);
    }
    const rows = await builder;
    const lastByBank = new Map<number, number>();
    for (const rec of rows) {
      if (!lastByBank.has(rec.accountId)) {
        lastByBank.set(rec.accountId, rec.id);
      }
    }

    const data = [];
    for (const rec of rows) {
      const lines = await this.loadLines.load(rec, true);
      const bankAccountBalance = await this.query.glBalanceAt(
        rec.accountId,
        rec.endDate,
      );
      const summary = this.query.summarize(rec, lines, bankAccountBalance);
      data.push({
        id: rec.id,
        accountId: rec.accountId,
        accountName: rec.account?.name || '',
        periodMonth: rec.periodMonth,
        startDate: rec.startDate,
        endDate: rec.endDate,
        status: rec.status,
        beginningBalance: money2(rec.beginningBalance),
        endingBalance: money2(rec.endingBalance),
        difference: summary.difference,
        closedAt: rec.closedAt || null,
        canReopen: lastByBank.get(rec.accountId) === rec.id && rec.status === 'closed',
      });
    }
    return { data };
  }
}
