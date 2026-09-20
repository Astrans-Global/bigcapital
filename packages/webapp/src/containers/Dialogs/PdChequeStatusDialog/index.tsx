// @ts-nocheck
import React, { lazy } from 'react';
import { Dialog, DialogSuspense, FormattedMessage as T } from '@/components';
import withDialogRedux from '@/components/DialogReduxConnect';
import { compose } from '@/utils';

const PdChequeStatusDialogContent = lazy(() =>
  import('./PdChequeStatusDialogContent').then((m) => ({
    default: m.PdChequeStatusDialogContent,
  })),
);

function PdChequeStatusDialog({ dialogName, payload = {}, isOpen }) {
  const isRealize = payload.action === 'realize';
  return (
    <Dialog
      name={dialogName}
      title={
        isRealize ? (
          <T id={'realize_cheque'} />
        ) : (
          <T id={'mark_deposited'} />
        )
      }
      className={'dialog--pd-cheque-status'}
      isOpen={isOpen}
      autoFocus={true}
      canEscapeKeyClose={true}
    >
      <DialogSuspense>
        <PdChequeStatusDialogContent
          dialogName={dialogName}
          action={payload.action}
          chequeId={payload.id}
          amount={payload.amount}
          currencyCode={payload.currencyCode}
        />
      </DialogSuspense>
    </Dialog>
  );
}

export const index = compose(withDialogRedux())(PdChequeStatusDialog);
