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
  useCustomerRouteCities,
  useDeleteCustomerRouteCity,
} from '@/hooks/query';
import { withDialogActions } from '@/containers/Dialog/withDialogActions';
import { DialogsName } from '@/constants/dialogs';
import { compose, safeCallback } from '@/utils';

function ActionMenuList({ row: { original }, payload: { onEdit, onDelete } }) {
  return (
    <Menu>
      <MenuItem
        icon={<Icon icon="pen-18" />}
        text={intl.get('edit_route_city')}
        onClick={safeCallback(onEdit, original)}
      />
      <MenuDivider />
      <MenuItem
        text={intl.get('delete_route_city')}
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

function useRouteCitiesTableColumns() {
  return React.useMemo(
    () => [
      {
        id: 'name',
        Header: intl.get('route_city_name'),
        accessor: 'name',
        width: 220,
      },
      {
        id: 'area',
        Header: intl.get('area'),
        accessor: (row) => row.area?.name,
        width: 220,
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
 * Customer route cities list actions bar.
 */
function CustomerRouteCitiesActionsBarInner({
  // #withDialogActions
  openDialog,
}) {
  const handleNewRouteCityClick = () => {
    openDialog(DialogsName.CustomerRouteCityForm, {});
  };

  return (
    <DashboardActionsBar>
      <NavbarGroup>
        <Button
          className={Classes.MINIMAL}
          icon={<Icon icon="plus" />}
          text={<T id={'new_route_city'} />}
          onClick={handleNewRouteCityClick}
        />
      </NavbarGroup>
    </DashboardActionsBar>
  );
}
const CustomerRouteCitiesActionsBar = compose(withDialogActions)(
  CustomerRouteCitiesActionsBarInner,
);

/**
 * Customer route cities table + delete confirmation.
 */
function CustomerRouteCitiesTableInner({
  // #withDialogActions
  openDialog,
}) {
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: customerRouteCities, isLoading, isFetching } =
    useCustomerRouteCities();
  const { mutateAsync: deleteCustomerRouteCity, isLoading: isDeleting } =
    useDeleteCustomerRouteCity();

  const columns = useRouteCitiesTableColumns();

  const handleEdit = (routeCity) => {
    openDialog(DialogsName.CustomerRouteCityForm, {
      action: 'edit',
      id: routeCity.id,
    });
  };
  const handleDelete = (routeCity) => {
    setDeleteTarget(routeCity);
  };
  const handleCancelDelete = () => setDeleteTarget(null);
  const handleConfirmDelete = () => {
    deleteCustomerRouteCity(deleteTarget.id)
      .then(() => {
        AppToaster.show({
          message: intl.get('the_route_city_has_been_deleted_successfully'),
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
        data={customerRouteCities || []}
        loading={isLoading}
        headerLoading={isLoading}
        progressBarLoading={isFetching}
        expandable={false}
        sticky={true}
        TableLoadingRenderer={TableSkeletonRows}
        noResults={intl.get('there_is_no_route_cities_in_table_yet')}
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
            id={'once_delete_route_city_cant_restore_data'}
          />
        </p>
      </Alert>
    </>
  );
}
const CustomerRouteCitiesTable = compose(withDialogActions)(
  CustomerRouteCitiesTableInner,
);

/**
 * Customer route cities list.
 */
export function CustomerRouteCitiesList() {
  return (
    <DashboardInsider name={'customer-route-cities-list'}>
      <CustomerRouteCitiesActionsBar />

      <DashboardPageContent>
        <DashboardContentTable>
          <CustomerRouteCitiesTable />
        </DashboardContentTable>
      </DashboardPageContent>
    </DashboardInsider>
  );
}
