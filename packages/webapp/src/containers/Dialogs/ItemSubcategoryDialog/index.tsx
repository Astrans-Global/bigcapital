// @ts-nocheck
import React, { lazy } from 'react';
import { Dialog, DialogSuspense, FormattedMessage as T } from '@/components';

import withDialogRedux from '@/components/DialogReduxConnect';
import { compose } from '@/utils';

const ItemSubcategoryFormDialogContent = lazy(() =>
  import('./ItemSubcategoryFormDialogContent').then((m) => ({
    default: m.ItemSubcategoryFormDialogContent,
  })),
);

/**
 * Item Subcategory form dialog.
 */
function ItemSubcategoryFormDialog({
  dialogName,
  payload = { action: '', id: null, categoryId: null },
  isOpen,
}) {
  return (
    <Dialog
      name={dialogName}
      title={
        payload.action === 'edit' ? (
          <T id={'edit_subcategory'} />
        ) : (
          <T id={'new_subcategory'} />
        )
      }
      className={'dialog--subcategory-form'}
      isOpen={isOpen}
      autoFocus={true}
      canEscapeKeyClose={true}
    >
      <DialogSuspense>
        <ItemSubcategoryFormDialogContent
          dialogName={dialogName}
          action={payload.action}
          itemSubcategoryId={payload.id}
          categoryId={payload.categoryId}
        />
      </DialogSuspense>
    </Dialog>
  );
}

export const index = compose(withDialogRedux())(ItemSubcategoryFormDialog);
