import { Inject, Injectable } from '@nestjs/common';
import { CreatePaymentReceivedDto } from '../dtos/PaymentReceived.dto';
import { SalesAgent } from '@/modules/SalesAgents/models/SalesAgent.model';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { ServiceError } from '@/modules/Items/ServiceError';
import { ERRORS } from '../constants';
import { PAYMENT_METHODS } from '../payment-methods';
import { Account } from '@/modules/Accounts/models/Account.model';
import { ACCOUNT_TYPE } from '@/constants/accounts';

@Injectable()
export class PaymentReceivedMethodService {
  constructor(
    @Inject(SalesAgent.name)
    private readonly salesAgentModel: TenantModelProxy<typeof SalesAgent>,

    @Inject(Account.name)
    private readonly accountModel: TenantModelProxy<typeof Account>,
  ) {}

  /**
   * Resolves deposit account from payment method + agent before GL posting.
   */
  public async applyCollectionMethod(
    paymentReceiveDTO: CreatePaymentReceivedDto,
  ): Promise<CreatePaymentReceivedDto> {
    const method = paymentReceiveDTO.paymentMethod || PAYMENT_METHODS.BANK_DEPOSIT;

    if (method === PAYMENT_METHODS.PD_CHEQUE) {
      throw new ServiceError(
        ERRORS.PDC_USE_CHEQUE_DOCUMENT,
        'Post-dated cheques must be saved as a cheque document, not a payment received.',
      );
    }

    if (method === PAYMENT_METHODS.CASH) {
      if (!paymentReceiveDTO.agentId) {
        throw new ServiceError(
          ERRORS.AGENT_REQUIRED,
          'Select the sales agent who collected the cash.',
        );
      }
      const agent = await this.salesAgentModel()
        .query()
        .findById(paymentReceiveDTO.agentId);

      if (!agent || agent.active === false) {
        throw new ServiceError(ERRORS.AGENT_NOT_FOUND, 'The agent was not found.');
      }
      if (!agent.cashAccountId) {
        throw new ServiceError(
          ERRORS.AGENT_CASH_ACCOUNT_MISSING,
          'This agent has no cash in hand account.',
        );
      }
      paymentReceiveDTO.depositAccountId = agent.cashAccountId;
      paymentReceiveDTO.paymentMethod = PAYMENT_METHODS.CASH;
      return paymentReceiveDTO;
    }

    if (
      method === PAYMENT_METHODS.BANK_TRANSFER ||
      method === PAYMENT_METHODS.BANK_DEPOSIT
    ) {
      if (!paymentReceiveDTO.depositAccountId) {
        throw new ServiceError(
          ERRORS.BANK_ACCOUNT_REQUIRED,
          'Select the bank account.',
        );
      }
      const bank = await this.accountModel()
        .query()
        .findById(paymentReceiveDTO.depositAccountId);

      if (!bank || !bank.isAccountType([ACCOUNT_TYPE.BANK])) {
        throw new ServiceError(
          ERRORS.DEPOSIT_ACCOUNT_INVALID_TYPE,
          'Bank transfer and bank deposit must go to a bank account.',
        );
      }
      paymentReceiveDTO.paymentMethod = method;
      paymentReceiveDTO.agentId = null;
      return paymentReceiveDTO;
    }

    throw new ServiceError(
      ERRORS.PAYMENT_METHOD_INVALID,
      'Choose cash, bank transfer, or bank deposit.',
    );
  }
}
