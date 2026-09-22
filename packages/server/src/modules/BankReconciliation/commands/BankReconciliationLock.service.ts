import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { Account } from '@/modules/Accounts/models/Account.model';
import { AccountTransaction } from '@/modules/Accounts/models/AccountTransaction.model';
import { PaymentReceived } from '@/modules/PaymentReceived/models/PaymentReceived';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { ACCOUNT_TYPE } from '@/constants/accounts';
import { ServiceError } from '@/modules/Items/ServiceError';
import { PD_CHEQUE_TX } from '@/modules/PdCheques/constants';
import { BankReconciliationQueryService } from '../queries/BankReconciliationQuery.service';
import { BankReconciliationSealsService } from './BankReconciliationSeals.service';
import {
  BANK_REC_ERRORS,
  BANK_REC_LOCK_MESSAGE,
  INVOICE_LOCK_MESSAGE,
} from '../constants';

@Injectable()
export class BankReconciliationLockService {
  constructor(
    private readonly query: BankReconciliationQueryService,
    private readonly seals: BankReconciliationSealsService,

    @Inject(Account.name)
    private readonly accountModel: TenantModelProxy<typeof Account>,

    @Inject(AccountTransaction.name)
    private readonly accountTransactionModel: TenantModelProxy<
      typeof AccountTransaction
    >,

    @Inject(PaymentReceived.name)
    private readonly paymentModel: TenantModelProxy<typeof PaymentReceived>,
  ) {}

  async assertReferenceUnlocked(
    referenceType: string,
    referenceId: number,
    trx?: Knex.Transaction,
  ) {
    const bankIds = (
      await this.accountModel()
        .query(trx)
        .where('account_type', ACCOUNT_TYPE.BANK)
        .select('id')
    ).map((bank) => bank.id);
    if (!bankIds.length) {
      return;
    }
    const txs = await this.accountTransactionModel()
      .query(trx)
      .where('reference_type', referenceType)
      .where('reference_id', referenceId)
      .whereIn('account_id', bankIds)
      .select('id');
    if (!txs.length) {
      return;
    }
    const locked = await this.query.tickedClosedTransactionIds(
      txs.map((tx) => Number(tx.id)),
      trx,
    );
    if (locked.length) {
      throw new ServiceError(
        BANK_REC_ERRORS.DOCUMENT_LOCKED_BY_BANK_REC,
        BANK_REC_LOCK_MESSAGE,
      );
    }
  }

  async assertPaymentUnlocked(paymentId: number, trx?: Knex.Transaction) {
    await this.assertReferenceUnlocked('PaymentReceive', paymentId, trx);
    const payment = await this.paymentModel().query(trx).findById(paymentId);
    if (!payment) {
      return;
    }
    const ids = await this.seals.paymentBankTransactionIds(payment, trx);
    const locked = await this.query.tickedClosedTransactionIds(ids, trx);
    if (locked.length) {
      throw new ServiceError(
        BANK_REC_ERRORS.DOCUMENT_LOCKED_BY_BANK_REC,
        BANK_REC_LOCK_MESSAGE,
      );
    }
  }

  async assertInvoiceUnlocked(invoiceId: number, trx?: Knex.Transaction) {
    const sealed = await this.seals.isInvoiceSealed(invoiceId, trx);
    if (sealed) {
      throw new ServiceError(
        BANK_REC_ERRORS.INVOICE_LOCKED_BY_BANK_REC,
        INVOICE_LOCK_MESSAGE,
      );
    }
  }

  async assertChequeUnlocked(chequeId: number, trx?: Knex.Transaction) {
    await this.assertReferenceUnlocked(PD_CHEQUE_TX.REALIZE, chequeId, trx);
  }
}
