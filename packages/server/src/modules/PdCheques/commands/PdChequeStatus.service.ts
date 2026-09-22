import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import * as moment from 'moment';
import { PdCheque } from '../models/PdCheque.model';
import { Account } from '@/modules/Accounts/models/Account.model';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { UnitOfWork } from '@/modules/Tenancy/TenancyDB/UnitOfWork.service';
import { ServiceError } from '@/modules/Items/ServiceError';
import { ACCOUNT_TYPE } from '@/constants/accounts';
import { PdChequeGLService } from './PdChequeGL.service';
import { PdChequeInvoiceSync } from './PdChequeInvoiceSync.service';
import { ERRORS, PD_CHEQUE_STATUS } from '../constants';
import { BankReconciliationLockService } from '@/modules/BankReconciliation/commands/BankReconciliationLock.service';

@Injectable()
export class PdChequeStatusService {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly gl: PdChequeGLService,
    private readonly invoiceSync: PdChequeInvoiceSync,
    private readonly bankRecLock: BankReconciliationLockService,

    @Inject(PdCheque.name)
    private readonly pdChequeModel: TenantModelProxy<typeof PdCheque>,

    @Inject(Account.name)
    private readonly accountModel: TenantModelProxy<typeof Account>,
  ) {}

  public async markDeposited(chequeId: number, bankAccountId: number) {
    const cheque = await this.requireCheque(chequeId);
    this.assertStatus(cheque.status, [PD_CHEQUE_STATUS.PENDING]);
    await this.requireBank(bankAccountId);

    return this.pdChequeModel().query().patchAndFetchById(chequeId, {
      status: PD_CHEQUE_STATUS.DEPOSITED,
      depositedBankId: bankAccountId,
    });
  }

  public async markRealized(
    chequeId: number,
    bankAccountId: number,
    realizeDate?: string,
  ) {
    const cheque = await this.requireCheque(chequeId);
    this.assertStatus(cheque.status, [
      PD_CHEQUE_STATUS.PENDING,
      PD_CHEQUE_STATUS.DEPOSITED,
    ]);
    await this.requireBank(bankAccountId);
    const date = realizeDate
      ? moment(realizeDate).format('YYYY-MM-DD')
      : moment().format('YYYY-MM-DD');

    return this.uow.withTransaction(async (trx: Knex.Transaction) => {
      await this.gl.writeRealizeEntries(chequeId, bankAccountId, date, trx);
      return this.pdChequeModel().query(trx).patchAndFetchById(chequeId, {
        status: PD_CHEQUE_STATUS.REALIZED,
        realizedBankId: bankAccountId,
        realizedAt: date,
        depositedBankId: cheque.depositedBankId || bankAccountId,
      });
    });
  }

  public async markReturned(chequeId: number) {
    await this.bankRecLock.assertChequeUnlocked(chequeId);
    const cheque = await this.requireCheque(chequeId);
    this.assertStatus(cheque.status, [
      PD_CHEQUE_STATUS.PENDING,
      PD_CHEQUE_STATUS.DEPOSITED,
    ]);

    return this.uow.withTransaction(async (trx: Knex.Transaction) => {
      await this.invoiceSync.saveChangeInvoicePaymentAmount(
        (cheque.entries || []).map((entry) => ({
          ...entry,
          paymentAmount: 0,
        })),
        cheque.entries || [],
        trx,
      );
      await this.gl.revertReceiveEntries(chequeId, trx);
      return this.pdChequeModel().query(trx).patchAndFetchById(chequeId, {
        status: PD_CHEQUE_STATUS.RETURNED,
        returnedAt: moment().format('YYYY-MM-DD'),
      });
    });
  }

  private async requireCheque(chequeId: number) {
    const cheque = await this.pdChequeModel()
      .query()
      .findById(chequeId)
      .withGraphFetched('entries');
    if (!cheque) {
      throw new ServiceError(ERRORS.PD_CHEQUE_NOT_FOUND, 'Cheque not found.');
    }
    return cheque;
  }

  private assertStatus(status: string, allowed: string[]) {
    if (!allowed.includes(status)) {
      throw new ServiceError(
        ERRORS.STATUS_NOT_ALLOWED,
        'This cheque cannot move to that status.',
      );
    }
  }

  private async requireBank(bankAccountId: number) {
    const bank = await this.accountModel().query().findById(bankAccountId);
    if (!bank || !bank.isAccountType([ACCOUNT_TYPE.BANK])) {
      throw new ServiceError(
        ERRORS.BANK_ACCOUNT_REQUIRED,
        'Select a bank account.',
      );
    }
    return bank;
  }
}
