import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { Account } from '@/modules/Accounts/models/Account.model';
import { AccountTransaction } from '@/modules/Accounts/models/AccountTransaction.model';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { ACCOUNT_TYPE } from '@/constants/accounts';
import { ServiceError } from '@/modules/Items/ServiceError';
import { BankReconciliation } from '../models/BankReconciliation.model';
import { BankReconciliationLine } from '../models/BankReconciliationLine.model';
import { BANK_REC_ERRORS, BANK_REC_STATUS } from '../constants';
import {
  addDays,
  firstDayOfMonth,
  formatDate,
  lastDayOfPreviousMonth,
  money2,
  monthLabel,
  previousMonth,
} from '../utils';

@Injectable()
export class BankReconciliationQueryService {
  constructor(
    @Inject(BankReconciliation.name)
    private readonly recModel: TenantModelProxy<typeof BankReconciliation>,

    @Inject(BankReconciliationLine.name)
    private readonly lineModel: TenantModelProxy<typeof BankReconciliationLine>,

    @Inject(Account.name)
    private readonly accountModel: TenantModelProxy<typeof Account>,

    @Inject(AccountTransaction.name)
    private readonly accountTransactionModel: TenantModelProxy<
      typeof AccountTransaction
    >,
  ) {}

  async requireBank(accountId: number) {
    const account = await this.accountModel().query().findById(accountId);
    if (!account || !account.isAccountType([ACCOUNT_TYPE.BANK])) {
      throw new ServiceError(
        BANK_REC_ERRORS.BANK_ACCOUNT_REQUIRED,
        'Select a bank account.',
      );
    }
    return account;
  }

  async requireRec(id: number, trx?: Knex.Transaction) {
    const rec = await this.recModel()
      .query(trx)
      .findById(id)
      .withGraphFetched('account')
      .withGraphFetched('lines');
    if (!rec) {
      throw new ServiceError(BANK_REC_ERRORS.BANK_REC_NOT_FOUND, 'Rec not found.');
    }
    return rec;
  }

  async listBankAccounts() {
    return this.accountModel()
      .query()
      .where('account_type', ACCOUNT_TYPE.BANK)
      .orderBy('name', 'ASC');
  }

  async lastRec(accountId: number, trx?: Knex.Transaction) {
    return this.recModel()
      .query(trx)
      .where('account_id', accountId)
      .orderBy('end_date', 'DESC')
      .orderBy('id', 'DESC')
      .first();
  }

  async lastClosedRec(accountId: number, trx?: Knex.Transaction) {
    return this.recModel()
      .query(trx)
      .where('account_id', accountId)
      .where('status', BANK_REC_STATUS.CLOSED)
      .orderBy('end_date', 'DESC')
      .orderBy('id', 'DESC')
      .first();
  }

  async draftForBank(accountId: number, trx?: Knex.Transaction) {
    return this.recModel()
      .query(trx)
      .where('account_id', accountId)
      .where('status', BANK_REC_STATUS.DRAFT)
      .first();
  }

  async glBalanceAt(
    accountId: number,
    asOfDate: string,
    inclusive = true,
    trx?: Knex.Transaction,
  ) {
    const query = this.accountTransactionModel()
      .query(trx)
      .where('account_id', accountId);
    if (inclusive) {
      query.where('date', '<=', asOfDate);
    } else {
      query.where('date', '<', asOfDate);
    }
    const row = await query
      .sum('debit as debit')
      .sum('credit as credit')
      .first();
    return money2(Number(row?.debit || 0) - Number(row?.credit || 0));
  }

  async beginningBalance(accountId: number, startDate: string, trx?: Knex.Transaction) {
    const lastClosed = await this.lastClosedRec(accountId, trx);
    if (lastClosed) {
      return money2(lastClosed.endingBalance);
    }
    return this.glBalanceAt(accountId, startDate, false, trx);
  }

  async assertNoOverlappingClosed(
    accountId: number,
    startDate: string,
    endDate: string,
    exceptId?: number,
    trx?: Knex.Transaction,
  ) {
    const query = this.recModel()
      .query(trx)
      .where('account_id', accountId)
      .where('status', BANK_REC_STATUS.CLOSED)
      .where('start_date', '<=', endDate)
      .where('end_date', '>=', startDate);
    if (exceptId) {
      query.whereNot('id', exceptId);
    }
    const overlap = await query.first();
    if (overlap) {
      throw new ServiceError(
        BANK_REC_ERRORS.OVERLAPPING_CLOSED_RANGE,
        'This date range overlaps a closed Rec for this bank.',
      );
    }
  }

  async hasBankActivity(
    accountId: number,
    startDate: string,
    endDate: string,
    trx?: Knex.Transaction,
  ) {
    if (endDate < startDate) {
      return false;
    }
    const row = await this.accountTransactionModel()
      .query(trx)
      .where('account_id', accountId)
      .where('date', '>=', startDate)
      .where('date', '<=', endDate)
      .where((builder) => {
        builder.where('debit', '>', 0).orWhere('credit', '>', 0);
      })
      .first();
    return Boolean(row);
  }

  async assertMonthAllowed(
    accountId: number,
    periodMonth: string,
    trx?: Knex.Transaction,
  ) {
    const lastClosed = await this.lastClosedRec(accountId, trx);
    if (!lastClosed) {
      return;
    }
    if (periodMonth <= lastClosed.periodMonth) {
      throw new ServiceError(
        BANK_REC_ERRORS.MONTH_NOT_ALLOWED,
        'Close or reopen later months before opening this month.',
      );
    }
    const prev = previousMonth(periodMonth);
    if (prev === lastClosed.periodMonth) {
      return;
    }
    const gapStart = addDays(formatDate(lastClosed.endDate), 1);
    const gapEnd = lastDayOfPreviousMonth(periodMonth);
    if (await this.hasBankActivity(accountId, gapStart, gapEnd, trx)) {
      throw new ServiceError(
        BANK_REC_ERRORS.MONTH_NOT_ALLOWED,
        'The previous month has bank activity and must be reconciled first.',
      );
    }
  }

  lockedStartDate(lastClosed?: BankReconciliation | null) {
    if (!lastClosed) {
      return null;
    }
    return addDays(formatDate(lastClosed.endDate), 1);
  }

  async closedTickedTransactionIds(
    accountId: number,
    exceptRecId?: number,
    trx?: Knex.Transaction,
  ): Promise<number[]> {
    const query = this.lineModel()
      .query(trx)
      .join(
        'bank_reconciliations',
        'bank_reconciliation_lines.reconciliation_id',
        'bank_reconciliations.id',
      )
      .where('bank_reconciliations.account_id', accountId)
      .where('bank_reconciliations.status', BANK_REC_STATUS.CLOSED)
      .where('bank_reconciliation_lines.ticked', true);
    if (exceptRecId) {
      query.whereNot('bank_reconciliations.id', exceptRecId);
    }
    const rows = await query.select(
      'bank_reconciliation_lines.account_transaction_id as id',
    );
    return rows.map((row: any) => Number(row.id));
  }

  async tickedClosedTransactionIds(
    transactionIds: number[],
    trx?: Knex.Transaction,
  ): Promise<number[]> {
    if (!transactionIds.length) {
      return [];
    }
    const rows = await this.lineModel()
      .query(trx)
      .join(
        'bank_reconciliations',
        'bank_reconciliation_lines.reconciliation_id',
        'bank_reconciliations.id',
      )
      .where('bank_reconciliations.status', BANK_REC_STATUS.CLOSED)
      .where('bank_reconciliation_lines.ticked', true)
      .whereIn('bank_reconciliation_lines.account_transaction_id', transactionIds)
      .select('bank_reconciliation_lines.account_transaction_id as id');
    return rows.map((row: any) => Number(row.id));
  }

  summarize(
    rec: BankReconciliation,
    lines: Array<{ debit: number; credit: number; ticked: boolean }>,
    bankAccountBalance: number,
  ) {
    const clearedDeposits = money2(
      lines
        .filter((line) => line.ticked && Number(line.debit) > 0)
        .reduce((sum, line) => sum + Number(line.debit), 0),
    );
    const unclearedDeposits = money2(
      lines
        .filter((line) => !line.ticked && Number(line.debit) > 0)
        .reduce((sum, line) => sum + Number(line.debit), 0),
    );
    const clearedPayments = money2(
      lines
        .filter((line) => line.ticked && Number(line.credit) > 0)
        .reduce((sum, line) => sum + Number(line.credit), 0),
    );
    const unclearedPayments = money2(
      lines
        .filter((line) => !line.ticked && Number(line.credit) > 0)
        .reduce((sum, line) => sum + Number(line.credit), 0),
    );
    const beginning = money2(rec.beginningBalance);
    const ending = money2(rec.endingBalance);
    const clearedBalance = money2(beginning + clearedDeposits - clearedPayments);
    const difference = money2(ending - clearedBalance);
    return {
      beginningBalance: beginning,
      endingBalance: ending,
      clearedDeposits,
      unclearedDeposits,
      clearedPayments,
      unclearedPayments,
      clearedBalance,
      bankAccountBalance: money2(bankAccountBalance),
      difference,
    };
  }

  suggestedPeriodMonth(endDate: string) {
    return monthLabel(endDate);
  }

  firstDayOfMonth = firstDayOfMonth;
}
