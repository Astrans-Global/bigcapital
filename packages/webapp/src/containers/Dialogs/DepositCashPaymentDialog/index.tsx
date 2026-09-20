// @ts-nocheck
import React, { lazy } from 'react';
import { Dialog, DialogSuspense, FormattedMessage as T } from '@/components';
import withDialogRedux from '@/components/DialogReduxConnect';
import { compose } from '@/utils';

const DepositCashPaymentDialogContent = lazy(() =>
  import('./DepositCashPaymentDialogContent').then((m) => ({
    default: m.DepositCashPaymentDialogContent,
  })),
);

function DepositCashPaymentDialog({
  dialogName,
  payload = {},
  isOpen,
}) {
  return (
    <Dialog
      name={dialogName}
      title={<T id={'mark_deposited'} />}
      className={'dialog--deposit-cash-payment'}
      isOpen={isOpen}
      autoFocus={true}
      canEscapeKeyClose={true}
    >
      <DialogSuspense>
        <DepositCashPaymentDialogContent
          dialogName={dialogName}
          paymentReceiveId={payload.paymentReceiveId}
          amount={payload.amount}
          currencyCode={payload.currencyCode}
        />
      </DialogSuspense>
    </Dialog>
  );
}

export const index = compose(withDialogRedux())(DepositCashPaymentDialog);
