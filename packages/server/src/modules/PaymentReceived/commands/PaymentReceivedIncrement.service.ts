import { Injectable } from '@nestjs/common';
import { AutoIncrementOrdersService } from '@/modules/AutoIncrementOrders/AutoIncrementOrders.service';
import { PAYMENT_METHODS } from '../payment-methods';

export const COLLECTION_NUMBER_GROUPS = {
  [PAYMENT_METHODS.CASH]: 'payment_receives_cash',
  [PAYMENT_METHODS.BANK_TRANSFER]: 'payment_receives_bank_transfer',
  [PAYMENT_METHODS.BANK_DEPOSIT]: 'payment_receives_bank_deposit',
  [PAYMENT_METHODS.PD_CHEQUE]: 'pd_cheques',
} as const;

@Injectable()
export class PaymentReceivedIncrement {
  constructor(
    private readonly autoIncrementOrdersService: AutoIncrementOrdersService,
  ) {}

  public groupForMethod(method?: string): string {
    return (
      COLLECTION_NUMBER_GROUPS[method || ''] ||
      COLLECTION_NUMBER_GROUPS[PAYMENT_METHODS.BANK_DEPOSIT]
    );
  }

  public getNextPaymentReceiveNumber(): Promise<string> {
    return this.autoIncrementOrdersService.getNextTransactionNumber(
      'payment_receives',
    );
  }

  public getNextForMethod(method?: string): Promise<string> {
    return this.autoIncrementOrdersService.peekNumber(
      this.groupForMethod(method),
    );
  }

  public incrementNextPaymentReceiveNumber() {
    return this.autoIncrementOrdersService.incrementSettingsNextNumber(
      'payment_receives',
    );
  }

  public incrementForMethod(method?: string) {
    return this.autoIncrementOrdersService.bumpNumber(
      this.groupForMethod(method),
    );
  }
}
