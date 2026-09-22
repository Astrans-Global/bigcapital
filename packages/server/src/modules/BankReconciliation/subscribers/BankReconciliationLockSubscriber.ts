import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { events } from '@/common/events/events';
import { BankReconciliationLockService } from '../commands/BankReconciliationLock.service';

@Injectable()
export class BankReconciliationLockSubscriber {
  constructor(private readonly lock: BankReconciliationLockService) {}

  @OnEvent(events.paymentReceive.onEditing, { suppressErrors: false })
  async onPaymentEditing({ oldPaymentReceive }: any) {
    await this.lock.assertPaymentUnlocked(oldPaymentReceive.id);
  }

  @OnEvent(events.paymentReceive.onDeleting, { suppressErrors: false })
  async onPaymentDeleting({ oldPaymentReceive }: any) {
    await this.lock.assertPaymentUnlocked(oldPaymentReceive.id);
  }

  @OnEvent(events.saleInvoice.onEditing, { suppressErrors: false })
  async onInvoiceEditing({ oldSaleInvoice }: any) {
    await this.lock.assertInvoiceUnlocked(oldSaleInvoice.id);
  }

  @OnEvent(events.saleInvoice.onDeleting, { suppressErrors: false })
  async onInvoiceDeleting({ oldSaleInvoice, saleInvoice }: any) {
    const id = oldSaleInvoice?.id || saleInvoice?.id;
    if (id) {
      await this.lock.assertInvoiceUnlocked(id);
    }
  }

  @OnEvent(events.expenses.onEditing, { suppressErrors: false })
  async onExpenseEditing({ oldExpense }: any) {
    await this.lock.assertReferenceUnlocked('Expense', oldExpense.id);
  }

  @OnEvent(events.expenses.onDeleting, { suppressErrors: false })
  async onExpenseDeleting({ oldExpense }: any) {
    await this.lock.assertReferenceUnlocked('Expense', oldExpense.id);
  }

  @OnEvent(events.billPayment.onEditing, { suppressErrors: false })
  async onBillPaymentEditing({ oldBillPayment }: any) {
    await this.lock.assertReferenceUnlocked('BillPayment', oldBillPayment.id);
  }

  @OnEvent(events.billPayment.onDeleting, { suppressErrors: false })
  async onBillPaymentDeleting({ oldBillPayment }: any) {
    await this.lock.assertReferenceUnlocked('BillPayment', oldBillPayment.id);
  }

  @OnEvent(events.cashflow.onTransactionDeleting, { suppressErrors: false })
  async onCashflowDeleting({ oldCashflowTransaction }: any) {
    const id = oldCashflowTransaction?.id;
    if (id) {
      await this.lock.assertReferenceUnlocked('CashflowTransaction', id);
    }
  }

  @OnEvent(events.manualJournals.onEditing, { suppressErrors: false })
  async onJournalEditing({ oldManualJournal }: any) {
    await this.lock.assertReferenceUnlocked('Journal', oldManualJournal.id);
    await this.lock.assertReferenceUnlocked(
      'ManualJournal',
      oldManualJournal.id,
    );
  }

  @OnEvent(events.manualJournals.onDeleting, { suppressErrors: false })
  async onJournalDeleting({ oldManualJournal }: any) {
    await this.lock.assertReferenceUnlocked('Journal', oldManualJournal.id);
    await this.lock.assertReferenceUnlocked(
      'ManualJournal',
      oldManualJournal.id,
    );
  }

  @OnEvent(events.saleReceipt.onEditing, { suppressErrors: false })
  async onSaleReceiptEditing({ oldSaleReceipt }: any) {
    await this.lock.assertReferenceUnlocked('SaleReceipt', oldSaleReceipt.id);
  }

  @OnEvent(events.saleReceipt.onDeleting, { suppressErrors: false })
  async onSaleReceiptDeleting({ oldSaleReceipt }: any) {
    await this.lock.assertReferenceUnlocked('SaleReceipt', oldSaleReceipt.id);
  }
}
