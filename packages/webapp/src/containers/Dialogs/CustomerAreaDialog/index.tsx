// @ts-nocheck
import React, { lazy } from 'react';
import { Dialog, DialogSuspense, FormattedMessage as T } from '@/components';

import withDialogRedux from '@/components/DialogReduxConnect';
import { compose } from '@/utils';

const CustomerAreaFormDialogContent = lazy(() =>
  import('./CustomerAreaFormDialogContent').then((m) => ({
    default: m.CustomerAreaFormDialogContent,
  })),
);

/**
 * Customer area form dialog.
 */
function CustomerAreaFormDialog({
  dialogName,
  payload = { action: '', id: null },
  isOpen,
}) {
  return (
    <Dialog
      name={dialogName}
      title={
        payload.action === 'edit' ? (
          <T id={'edit_area'} />
        ) : (
          <T id={'new_area'} />
        )
      }
      className={'dialog--customer-area-form'}
      isOpen={isOpen}
      autoFocus={true}
      canEscapeKeyClose={true}
    >
      <DialogSuspense>
        <CustomerAreaFormDialogContent
          dialogName={dialogName}
          action={payload.action}
          customerAreaId={payload.id}
        />
      </DialogSuspense>
    </Dialog>
  );
}

export const index = compose(withDialogRedux())(CustomerAreaFormDialog);
