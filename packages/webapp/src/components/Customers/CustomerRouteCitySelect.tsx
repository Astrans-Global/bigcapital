// @ts-nocheck
import * as R from 'ramda';
import intl from 'react-intl-universal';
import { FSelect } from '../Forms';
import { DialogsName } from '@/constants/dialogs';
import { withDialogActions } from '@/containers/Dialog/withDialogActions';
import { MenuItem } from '@blueprintjs/core';

const createNewItemRenderer = (query, active, handleClick) => {
  return (
    <MenuItem
      icon="add"
      text={intl.get('list.create', { value: `"${query}"` })}
      active={active}
      onClick={handleClick}
    />
  );
};

const createNewItemFromQuery = (name) => ({ name });

/**
 * Customer route city select field binded with Formik form.
 * @returns {JSX.Element}
 */
function CustomerRouteCitySelectRoot({
  // #withDialogActions
  openDialog,

  // #ownProps
  allowCreate = true,
  areaId,

  ...restProps
}) {
  const maybeCreateNewItemRenderer = allowCreate ? createNewItemRenderer : null;
  const maybeCreateNewItemFromQuery = allowCreate
    ? createNewItemFromQuery
    : null;

  const handleCreateItemClick = () => {
    openDialog(DialogsName.CustomerRouteCityForm, { areaId });
  };

  return (
    <FSelect
      valueAccessor={'id'}
      textAccessor={'name'}
      popoverProps={{ minimal: true, usePortal: true, inline: false }}
      createNewItemRenderer={maybeCreateNewItemRenderer}
      createNewItemFromQuery={maybeCreateNewItemFromQuery}
      onCreateItemSelect={handleCreateItemClick}
      placeholder={intl.get('select_route_city')}
      {...restProps}
    />
  );
}

export const CustomerRouteCitySelect = R.compose(withDialogActions)(
  CustomerRouteCitySelectRoot,
);
