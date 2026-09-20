import { Inject, Injectable } from '@nestjs/common';
import { PaymentReceived } from '../models/PaymentReceived';
import { Account } from '@/modules/Accounts/models/Account.model';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { CreateBankTransactionService } from '@/modules/BankingTransactions/commands/CreateBankTransaction.service';
import { CASHFLOW_TRANSACTION_TYPE } from '@/modules/BankingTransactions/constants';
import { ServiceError } from '@/modules/Items/ServiceError';
import { ACCOUNT_TYPE } from '@/constants/accounts';
import { ERRORS } from '../constants';
import { PAYMENT_METHODS } from '../payment-methods';
import { DepositCashPaymentDto } from '../dtos/DepositCashPayment.dto';
import * as moment from 'moment';

@Injectable()
export class DepositCashPaymentReceivedService {
  constructor(
    private readonly createBankTransaction: CreateBankTransactionService,

    @Inject(PaymentReceived.name)
    private readonly paymentReceivedModel: TenantModelProxy<
      typeof PaymentReceived
    >,

    @Inject(Account.name)
    private readonly accountModel: TenantModelProxy<typeof Account>,
  ) {}

  public async depositCashPayment(
    paymentReceiveId: number,
    dto: DepositCashPaymentDto,
  ) {
    const payment = await this.paymentReceivedModel()
      .query()
      .findById(paymentReceiveId)
      .throwIfNotFound();

    if (payment.paymentMethod !== PAYMENT_METHODS.CASH) {
      throw new ServiceError(
        ERRORS.PAYMENT_METHOD_INVALID,
        'Only cash collections can be marked deposited.',
      );
    }
    if (payment.depositedAt) {
      throw new ServiceError(
        ERRORS.CASH_ALREADY_DEPOSITED,
        'This cash collection is already deposited.',
      );
    }
    if (!payment.depositAccountId) {
      throw new ServiceError(
        ERRORS.AGENT_CASH_ACCOUNT_MISSING,
        'This cash collection has no agent cash account.',
      );
    }

    const bank = await this.accountModel().query().findById(dto.bankAccountId);
    if (!bank || !bank.isAccountType([ACCOUNT_TYPE.BANK])) {
      throw new ServiceError(
        ERRORS.BANK_ACCOUNT_REQUIRED,
        'Select a bank account.',
      );
    }

    const depositDate = dto.depositDate
      ? moment(dto.depositDate).format('YYYY-MM-DD')
      : moment().format('YYYY-MM-DD');

    await this.createBankTransaction.newCashflowTransaction(
      {
        date: depositDate as unknown as Date,
        transactionType: CASHFLOW_TRANSACTION_TYPE.TRANSFER_FROM_ACCOUNT,
        description: `Cash deposit ${payment.paymentReceiveNo || payment.id}`,
        amount: payment.amount,
        exchangeRate: payment.exchangeRate || 1,
        creditAccountId: payment.depositAccountId,
        cashflowAccountId: bank.id,
        publish: true,
        referenceNo: payment.referenceNo || payment.paymentReceiveNo,
        branchId: payment.branchId,
      },
      payment.userId,
    );

    return this.paymentReceivedModel().query().patchAndFetchById(paymentReceiveId, {
      depositedAt: depositDate,
      depositedBankId: bank.id,
    });
  }
}
