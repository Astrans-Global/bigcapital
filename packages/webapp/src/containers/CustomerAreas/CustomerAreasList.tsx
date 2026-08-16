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

import { useCustomerAreas, useDeleteCustomerArea } from '@/hooks/query';
import { withDialogActions } from '@/containers/Dialog/withDialogActions';
import { DialogsName } from '@/constants/dialogs';
import { compose, safeCallback } from '@/utils';

function ActionMenuList({ row: { original }, payload: { onEdit, onDelete } }) {
  return (
    <Menu>
      <MenuItem
        icon={<Icon icon="pen-18" />}
        text={intl.get('edit_area')}
        onClick={safeCallback(onEdit, original)}
      />
      <MenuDivider />
      <MenuItem
        text={intl.get('delete_area')}
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

function useAreasTableColumns() {
  return React.useMemo(
    () => [
      {
        id: 'name',
        Header: intl.get('area_name'),
        accessor: 'name',
        width: 220,
      },
      {
        id: 'invoiceNumberCode',
        Header: intl.get('area_invoice_code'),
        accessor: 'invoiceNumberCode',
        width: 160,
      },
      {
        id: 'nextInvoiceNumber',
        Header: intl.get('area_next_invoice_number'),
        accessor: 'nextInvoiceNumber',
        width: 160,
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
 * Customer areas list actions bar.
 */
function CustomerAreasActionsBarInner({
  // #withDialogActions
  openDialog,
}) {
  const handleNewAreaClick = () => {
    openDialog(DialogsName.CustomerAreaForm, {});
  };

  return (
    <DashboardActionsBar>
      <NavbarGroup>
        <Button
          className={Classes.MINIMAL}
          icon={<Icon icon="plus" />}
          text={<T id={'new_area'} />}
          onClick={handleNewAreaClick}
        />
      </NavbarGroup>
    </DashboardActionsBar>
  );
}
const CustomerAreasActionsBar = compose(withDialogActions)(
  CustomerAreasActionsBarInner,
);

/**
 * Customer areas table + delete confirmation.
 */
function CustomerAreasTableInner({
  // #withDialogActions
  openDialog,
}) {
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: customerAreas, isLoading, isFetching } = useCustomerAreas();
  const { mutateAsync: deleteCustomerArea, isLoading: isDeleting } =
    useDeleteCustomerArea();

  const columns = useAreasTableColumns();

  const handleEdit = (area) => {
    openDialog(DialogsName.CustomerAreaForm, {
      action: 'edit',
      id: area.id,
    });
  };
  const handleDelete = (area) => {
    setDeleteTarget(area);
  };
  const handleCancelDelete = () => setDeleteTarget(null);
  const handleConfirmDelete = () => {
    deleteCustomerArea(deleteTarget.id)
      .then(() => {
        AppToaster.show({
          message: intl.get('the_area_has_been_deleted_successfully'),
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
        data={customerAreas || []}
        loading={isLoading}
        headerLoading={isLoading}
        progressBarLoading={isFetching}
        expandable={false}
        sticky={true}
        TableLoadingRenderer={TableSkeletonRows}
        noResults={intl.get('there_is_no_areas_in_table_yet')}
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
          <FormattedHTMLMessage id={'once_delete_area_cant_restore_data'} />
        </p>
      </Alert>
    </>
  );
}
const CustomerAreasTable = compose(withDialogActions)(CustomerAreasTableInner);

/**
 * Customer areas list.
 */
export function CustomerAreasList() {
  return (
    <DashboardInsider name={'customer-areas-list'}>
      <CustomerAreasActionsBar />

      <DashboardPageContent>
        <DashboardContentTable>
          <CustomerAreasTable />
        </DashboardContentTable>
      </DashboardPageContent>
    </DashboardInsider>
  );
}
