import { Intent } from '@blueprintjs/core';
import { AppToaster } from '@/components';

export const BANK_REC_LOCK_TOAST =
  'This document is on a closed bank reconciliation. Reopen the last Rec for that bank first.';

export const INVOICE_REC_LOCK_TOAST =
  'This invoice is sealed. Reopen the last Rec for that bank first.';

export function toastBankRecErrors(errors: any[] = []) {
  const list = Array.isArray(errors) ? errors : [];
  const type = (name: string) => list.find((error) => error.type === name);

  if (type('DOCUMENT_LOCKED_BY_BANK_REC')) {
    AppToaster.show({ intent: Intent.DANGER, message: BANK_REC_LOCK_TOAST });
    return true;
  }
  if (type('INVOICE_LOCKED_BY_BANK_REC')) {
    AppToaster.show({ intent: Intent.DANGER, message: INVOICE_REC_LOCK_TOAST });
    return true;
  }
  if (type('DIFFERENCE_NOT_ZERO')) {
    AppToaster.show({
      intent: Intent.DANGER,
      message:
        type('DIFFERENCE_NOT_ZERO')?.message ||
        'Balance difference must be 0.00 before closing.',
    });
    return true;
  }
  if (type('MONTH_NOT_ALLOWED')) {
    AppToaster.show({
      intent: Intent.DANGER,
      message:
        type('MONTH_NOT_ALLOWED')?.message ||
        'The previous month must be reconciled first.',
    });
    return true;
  }
  if (type('START_DATE_LOCKED')) {
    AppToaster.show({
      intent: Intent.DANGER,
      message:
        type('START_DATE_LOCKED')?.message ||
        'Start date is locked to the day after the last Rec.',
    });
    return true;
  }
  if (type('CANNOT_REOPEN')) {
    AppToaster.show({
      intent: Intent.DANGER,
      message:
        type('CANNOT_REOPEN')?.message ||
        'Reopen the later Rec for this bank first.',
    });
    return true;
  }
  if (type('BANK_ACCOUNT_REQUIRED')) {
    AppToaster.show({
      intent: Intent.DANGER,
      message: 'Select a bank account.',
    });
    return true;
  }
  return false;
}
