// @ts-nocheck
import React, { lazy } from 'react';
import { Dialog, DialogSuspense, FormattedMessage as T } from '@/components';

import withDialogRedux from '@/components/DialogReduxConnect';
import { compose } from '@/utils';

const SalesAgentFormDialogContent = lazy(() =>
  import('./SalesAgentFormDialogContent').then((m) => ({
    default: m.SalesAgentFormDialogContent,
  })),
);

function SalesAgentFormDialog({
  dialogName,
  payload = { action: '', id: null },
  isOpen,
}) {
  return (
    <Dialog
      name={dialogName}
      title={
        payload.action === 'edit' ? (
          <T id={'edit_agent'} />
        ) : (
          <T id={'new_agent'} />
        )
      }
      className={'dialog--sales-agent-form'}
      isOpen={isOpen}
      autoFocus={true}
      canEscapeKeyClose={true}
    >
      <DialogSuspense>
        <SalesAgentFormDialogContent
          dialogName={dialogName}
          action={payload.action}
          salesAgentId={payload.id}
        />
      </DialogSuspense>
    </Dialog>
  );
}

export const index = compose(withDialogRedux())(SalesAgentFormDialog);
