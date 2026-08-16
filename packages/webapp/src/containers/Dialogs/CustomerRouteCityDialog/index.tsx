// @ts-nocheck
import React, { lazy } from 'react';
import { Dialog, DialogSuspense, FormattedMessage as T } from '@/components';

import withDialogRedux from '@/components/DialogReduxConnect';
import { compose } from '@/utils';

const CustomerRouteCityFormDialogContent = lazy(() =>
  import('./CustomerRouteCityFormDialogContent').then((m) => ({
    default: m.CustomerRouteCityFormDialogContent,
  })),
);

/**
 * Customer route city form dialog.
 */
function CustomerRouteCityFormDialog({
  dialogName,
  payload = { action: '', id: null, areaId: null },
  isOpen,
}) {
  return (
    <Dialog
      name={dialogName}
      title={
        payload.action === 'edit' ? (
          <T id={'edit_route_city'} />
        ) : (
          <T id={'new_route_city'} />
        )
      }
      className={'dialog--customer-route-city-form'}
      isOpen={isOpen}
      autoFocus={true}
      canEscapeKeyClose={true}
    >
      <DialogSuspense>
        <CustomerRouteCityFormDialogContent
          dialogName={dialogName}
          action={payload.action}
          customerRouteCityId={payload.id}
          areaId={payload.areaId}
        />
      </DialogSuspense>
    </Dialog>
  );
}

export const index = compose(withDialogRedux())(CustomerRouteCityFormDialog);
