import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { Account } from '@/modules/Accounts/models/Account.model';
import { AccountTransaction } from '@/modules/Accounts/models/AccountTransaction.model';
import { PaymentReceived } from '@/modules/PaymentReceived/models/PaymentReceived';
import { PaymentReceivedEntry } from '@/modules/PaymentReceived/models/PaymentReceivedEntry';
import { PdCheque } from '@/modules/PdCheques/models/PdCheque.model';
import { PdChequeEntry } from '@/modules/PdCheques/models/PdChequeEntry.model';
import { SaleInvoice } from '@/modules/SaleInvoices/models/SaleInvoice';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { ACCOUNT_TYPE } from '@/constants/accounts';
import { PD_CHEQUE_STATUS, PD_CHEQUE_TX } from '@/modules/PdCheques/constants';
import { BankReconciliationQueryService } from '../queries/BankReconciliationQuery.service';
import { money2 } from '../utils';

@Injectable()
export class BankReconciliationSealsService {
  constructor(
    private readonly query: BankReconciliationQueryService,

    @Inject(Account.name)
    private readonly accountModel: TenantModelProxy<typeof Account>,

    @Inject(AccountTransaction.name)
    private readonly accountTransactionModel: TenantModelProxy<
      typeof AccountTransaction
    >,

    @Inject(PaymentReceived.name)
    private readonly paymentModel: TenantModelProxy<typeof PaymentReceived>,

    @Inject(PaymentReceivedEntry.name)
    private readonly paymentEntryModel: TenantModelProxy<
      typeof PaymentReceivedEntry
    >,

    @Inject(PdCheque.name)
    private readonly pdChequeModel: TenantModelProxy<typeof PdCheque>,

    @Inject(PdChequeEntry.name)
    private readonly pdChequeEntryModel: TenantModelProxy<typeof PdChequeEntry>,

    @Inject(SaleInvoice.name)
    private readonly saleInvoiceModel: TenantModelProxy<typeof SaleInvoice>,
  ) {}

  async bankAccountIds(trx?: Knex.Transaction): Promise<number[]> {
    const banks = await this.accountModel()
      .query(trx)
      .where('account_type', ACCOUNT_TYPE.BANK)
      .select('id');
    return banks.map((bank) => bank.id);
  }

  async isReferenceCleared(
    referenceType: string,
    referenceId: number,
    trx?: Knex.Transaction,
  ): Promise<boolean> {
    const bankIds = await this.bankAccountIds(trx);
    if (!bankIds.length) {
      return false;
    }
    const txs = await this.accountTransactionModel()
      .query(trx)
      .where('reference_type', referenceType)
      .where('reference_id', referenceId)
      .whereIn('account_id', bankIds)
      .select('id');
    if (!txs.length) {
      return false;
    }
    const locked = await this.query.tickedClosedTransactionIds(
      txs.map((tx) => Number(tx.id)),
      trx,
    );
    return locked.length > 0;
  }

  async paymentBankTransactionIds(
    payment: PaymentReceived,
    trx?: Knex.Transaction,
  ): Promise<number[]> {
    const bankIds = await this.bankAccountIds(trx);
    if (!bankIds.length) {
      return [];
    }
    const direct = await this.accountTransactionModel()
      .query(trx)
      .where('reference_type', 'PaymentReceive')
      .where('reference_id', payment.id)
      .whereIn('account_id', bankIds)
      .select('id');
    const ids = direct.map((tx) => Number(tx.id));

    if (payment.depositedAt && payment.depositedBankId) {
      const depositQuery = this.accountTransactionModel()
        .query(trx)
        .where('reference_type', 'CashflowTransaction')
        .where('account_id', payment.depositedBankId)
        .where('date', String(payment.depositedAt).slice(0, 10))
        .where('debit', '>', 0);
      const deposits = await depositQuery.select(
        'id',
        'debit',
        'transactionNumber',
        'referenceNumber',
      );
      const needle = String(
        payment.paymentReceiveNo || payment.referenceNo || payment.id,
      );
      const amount = money2(payment.amount);
      const matched = deposits.filter((tx) => {
        const amountMatch = money2(tx.debit) === amount;
        const ref =
          `${tx.transactionNumber || ''} ${tx.referenceNumber || ''}`.toLowerCase();
        return amountMatch && (ref.includes(needle.toLowerCase()) || !needle);
      });
      const chosen = matched.length ? matched : deposits.filter((tx) => money2(tx.debit) === amount);
      chosen.forEach((tx) => ids.push(Number(tx.id)));
    }
    return [...new Set(ids)];
  }

  async isPaymentCleared(
    paymentId: number,
    trx?: Knex.Transaction,
  ): Promise<boolean> {
    const payment = await this.paymentModel().query(trx).findById(paymentId);
    if (!payment) {
      return false;
    }
    const ids = await this.paymentBankTransactionIds(payment, trx);
    if (!ids.length) {
      return false;
    }
    const locked = await this.query.tickedClosedTransactionIds(ids, trx);
    return locked.length > 0;
  }

  async isChequeCleared(
    chequeId: number,
    trx?: Knex.Transaction,
  ): Promise<boolean> {
    const cheque = await this.pdChequeModel().query(trx).findById(chequeId);
    if (!cheque || cheque.status !== PD_CHEQUE_STATUS.REALIZED) {
      return false;
    }
    return this.isReferenceCleared(PD_CHEQUE_TX.REALIZE, chequeId, trx);
  }

  async paymentsClearedMap(
    paymentIds: number[],
    trx?: Knex.Transaction,
  ): Promise<Record<number, boolean>> {
    const map: Record<number, boolean> = {};
    for (const id of paymentIds) {
      map[id] = await this.isPaymentCleared(id, trx);
    }
    return map;
  }

  async invoicesSealedMap(
    invoiceIds: number[],
    trx?: Knex.Transaction,
  ): Promise<Record<number, boolean>> {
    const map: Record<number, boolean> = {};
    for (const id of invoiceIds) {
      map[id] = await this.isInvoiceSealed(id, trx);
    }
    return map;
  }

  async isInvoiceSealed(
    invoiceId: number,
    trx?: Knex.Transaction,
  ): Promise<boolean> {
    const invoice = await this.saleInvoiceModel().query(trx).findById(invoiceId);
    if (!invoice) {
      return false;
    }
    if (money2((invoice as any).dueAmount) > 0) {
      return false;
    }

    const paymentEntries = await this.paymentEntryModel()
      .query(trx)
      .where('invoice_id', invoiceId);
    const chequeEntries = await this.pdChequeEntryModel()
      .query(trx)
      .where('invoice_id', invoiceId);

    if (!paymentEntries.length && !chequeEntries.length) {
      return false;
    }

    for (const entry of paymentEntries) {
      const cleared = await this.isPaymentCleared(entry.paymentReceiveId, trx);
      if (!cleared) {
        return false;
      }
    }
    for (const entry of chequeEntries) {
      const cleared = await this.isChequeCleared(entry.pdChequeId, trx);
      if (!cleared) {
        return false;
      }
    }
    return true;
  }

  async attachInvoiceSeal<T extends { id?: number }>(invoice: T): Promise<T> {
    const id = Number((invoice as any).id);
    if (!id) {
      return invoice;
    }
    (invoice as any).isBankRecSealed = await this.isInvoiceSealed(id);
    return invoice;
  }

  async attachInvoiceSeals<T extends { id?: number }>(invoices: T[]): Promise<T[]> {
    const ids = invoices.map((invoice) => Number((invoice as any).id)).filter(Boolean);
    const map = await this.invoicesSealedMap(ids);
    invoices.forEach((invoice) => {
      (invoice as any).isBankRecSealed = map[Number((invoice as any).id)] === true;
    });
    return invoices;
  }

  async attachPaymentSeal<T extends { id?: number }>(payment: T): Promise<T> {
    const id = Number((payment as any).id);
    if (!id) {
      return payment;
    }
    (payment as any).isBankRecCleared = await this.isPaymentCleared(id);
    return payment;
  }

  async attachPaymentSeals<T extends { id?: number }>(payments: T[]): Promise<T[]> {
    const ids = payments.map((payment) => Number((payment as any).id)).filter(Boolean);
    const map = await this.paymentsClearedMap(ids);
    payments.forEach((payment) => {
      (payment as any).isBankRecCleared = map[Number((payment as any).id)] === true;
    });
    return payments;
  }
}
