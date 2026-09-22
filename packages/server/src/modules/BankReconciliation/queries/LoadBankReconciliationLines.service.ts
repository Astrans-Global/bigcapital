import { Inject, Injectable } from '@nestjs/common';
import { AccountTransaction } from '@/modules/Accounts/models/AccountTransaction.model';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { BankReconciliation } from '../models/BankReconciliation.model';
import { BankReconciliationQueryService } from './BankReconciliationQuery.service';
import { money2 } from '../utils';

export interface BankRecWorksheetLine {
  id: number;
  accountTransactionId: number;
  date: string;
  referenceNo: string;
  payee: string;
  type: string;
  debit: number;
  credit: number;
  amount: number;
  ticked: boolean;
  referenceType: string;
  referenceId: number;
}

@Injectable()
export class LoadBankReconciliationLinesService {
  constructor(
    private readonly query: BankReconciliationQueryService,

    @Inject(AccountTransaction.name)
    private readonly accountTransactionModel: TenantModelProxy<
      typeof AccountTransaction
    >,
  ) {}

  async load(
    rec: BankReconciliation,
    hideAfterStatementDate = true,
  ): Promise<BankRecWorksheetLine[]> {
    const excluded = await this.query.closedTickedTransactionIds(
      rec.accountId,
      rec.id,
    );
    const ticks = new Map(
      (rec.lines || []).map((line) => [
        Number(line.accountTransactionId),
        Boolean(line.ticked),
      ]),
    );

    const builder = this.accountTransactionModel()
      .query()
      .where('account_id', rec.accountId)
      .withGraphFetched('contact')
      .orderBy('date', 'ASC')
      .orderBy('id', 'ASC');

    if (hideAfterStatementDate) {
      builder.where('date', '<=', rec.endDate);
    }
    if (excluded.length) {
      builder.whereNotIn('id', excluded);
    }

    const rows = await builder;
    return rows.map((row) => this.toLine(row, ticks.get(Number(row.id)) === true));
  }

  private toLine(row: AccountTransaction, ticked: boolean): BankRecWorksheetLine {
    const debit = money2(row.debit);
    const credit = money2(row.credit);
    const contact = (row as any).contact;
    return {
      id: Number(row.id),
      accountTransactionId: Number(row.id),
      date: String(row.date).slice(0, 10),
      referenceNo: row.transactionNumber || row.referenceNumber || '',
      payee: contact?.displayName || contact?.display_name || '',
      type: row.referenceTypeFormatted || row.referenceType || '',
      debit,
      credit,
      amount: debit > 0 ? debit : credit,
      ticked,
      referenceType: row.referenceType,
      referenceId: Number(row.referenceId),
    };
  }
}
