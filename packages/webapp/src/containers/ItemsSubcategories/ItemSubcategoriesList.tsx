// @ts-nocheck
import React, { useState } from 'react';
import intl from 'react-intl-universal';
import {
  NavbarGroup,
  Button,
  Classes,
  Intent,
  Alert,
  Menu,
  MenuItem,
  MenuDivider,
  Popover,
  Position,
} from '@blueprintjs/core';

import {
  DashboardInsider,
  DashboardPageContent,
  DashboardContentTable,
  DashboardActionsBar,
  DataTable,
  TableSkeletonRows,
  Icon,
  FormattedMessage as T,
  FormattedHTMLMessage,
  AppToaster,
} from '@/components';

import {
  useItemsSubcategories,
  useDeleteItemSubcategory,
} from '@/hooks/query';
import { withDialogActions } from '@/containers/Dialog/withDialogActions';
import { DialogsName } from '@/constants/dialogs';
import { compose, safeCallback } from '@/utils';

function ActionMenuList({ row: { original }, payload: { onEdit, onDelete } }) {
  return (
    <Menu>
      <MenuItem
        icon={<Icon icon="pen-18" />}
        text={intl.get('edit_subcategory')}
        onClick={safeCallback(onEdit, original)}
      />
      <MenuDivider />
      <MenuItem
        text={intl.get('delete_subcategory')}
        intent={Intent.DANGER}
        onClick={safeCallback(onDelete, original)}
        icon={<Icon icon="trash-16" iconSize={16} />}
      />
    </Menu>
  );
}

function TableActionsCell(props) {
  return (
    <Popover content={<ActionMenuList {...props} />} position={Position.RIGHT_TOP}>
      <Button icon={<Icon icon="more-h-16" iconSize={16} />} minimal />
    </Popover>
  );
}

function useSubcategoriesTableColumns() {
  return React.useMemo(
    () => [
      {
        id: 'name',
        Header: intl.get('subcategory_name'),
        accessor: 'name',
        width: 220,
      },
      {
        id: 'category',
        Header: intl.get('category'),
        accessor: (row) => row.category?.name,
        width: 220,
      },
      {
        id: 'description',
        Header: intl.get('description'),
        accessor: 'description',
        width: 260,
      },
      {
        id: 'actions',
        Header: '',
        Cell: TableActionsCell,
        className: 'actions',
        width: 60,
        disableResizing: true,
        clickable: true,
      },
    ],
    [],
  );
}

/**
 * Item subcategories list actions bar.
 */
function ItemSubcategoriesActionsBarInner({
  // #withDialogActions
  openDialog,
}) {
  const handleNewSubcategoryClick = () => {
    openDialog(DialogsName.ItemSubcategoryForm, {});
  };

  return (
    <DashboardActionsBar>
      <NavbarGroup>
        <Button
          className={Classes.MINIMAL}
          icon={<Icon icon="plus" />}
          text={<T id={'new_subcategory'} />}
          onClick={handleNewSubcategoryClick}
        />
      </NavbarGroup>
    </DashboardActionsBar>
  );
}
const ItemSubcategoriesActionsBar = compose(withDialogActions)(
  ItemSubcategoriesActionsBarInner,
);

/**
 * Item subcategories table + delete confirmation.
 */
function ItemSubcategoriesTableInner({
  // #withDialogActions
  openDialog,
}) {
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: itemsSubcategories, isLoading, isFetching } =
    useItemsSubcategories();
  const { mutateAsync: deleteItemSubcategory, isLoading: isDeleting } =
    useDeleteItemSubcategory();

  const columns = useSubcategoriesTableColumns();

  const handleEdit = (subcategory) => {
    openDialog(DialogsName.ItemSubcategoryForm, {
      action: 'edit',
      id: subcategory.id,
    });
  };
  const handleDelete = (subcategory) => {
    setDeleteTarget(subcategory);
  };
  const handleCancelDelete = () => setDeleteTarget(null);
  const handleConfirmDelete = () => {
    deleteItemSubcategory(deleteTarget.id)
      .then(() => {
        AppToaster.show({
          message: intl.get(
            'the_item_subcategory_has_been_deleted_successfully',
          ),
          intent: Intent.SUCCESS,
        });
      })
      .catch(() => {})
      .finally(() => setDeleteTarget(null));
  };

  return (
    <>
      <DataTable
        noInitialFetch={true}
        columns={columns}
        data={itemsSubcategories || []}
        loading={isLoading}
        headerLoading={isLoading}
        progressBarLoading={isFetching}
        expandable={false}
        sticky={true}
        TableLoadingRenderer={TableSkeletonRows}
        noResults={intl.get('there_is_no_items_subcategories_in_table_yet')}
        payload={{ onEdit: handleEdit, onDelete: handleDelete }}
        ContextMenu={ActionMenuList}
      />

      <Alert
        cancelButtonText={<T id={'cancel'} />}
        confirmButtonText={<T id={'delete'} />}
        icon="trash"
        intent={Intent.DANGER}
        isOpen={!!deleteTarget}
        loading={isDeleting}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      >
        <p>
          <FormattedHTMLMessage
            id={'once_delete_subcategory_cant_restore_data'}
          />
        </p>
      </Alert>
    </>
  );
}
const ItemSubcategoriesTable = compose(withDialogActions)(
  ItemSubcategoriesTableInner,
);

/**
 * Item subcategories list.
 */
export function ItemSubcategoriesList() {
  return (
    <DashboardInsider name={'items-subcategories-list'}>
      <ItemSubcategoriesActionsBar />

      <DashboardPageContent>
        <DashboardContentTable>
          <ItemSubcategoriesTable />
        </DashboardContentTable>
      </DashboardPageContent>
    </DashboardInsider>
  );
}
