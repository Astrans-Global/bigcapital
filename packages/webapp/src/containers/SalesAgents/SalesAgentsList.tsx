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

import { useSalesAgents, useDeleteSalesAgent } from '@/hooks/query';
import { withDialogActions } from '@/containers/Dialog/withDialogActions';
import { DialogsName } from '@/constants/dialogs';
import { compose, safeCallback } from '@/utils';

function ActionMenuList({ row: { original }, payload: { onEdit, onDelete } }) {
  return (
    <Menu>
      <MenuItem
        icon={<Icon icon="pen-18" />}
        text={intl.get('edit_agent')}
        onClick={safeCallback(onEdit, original)}
      />
      <MenuDivider />
      <MenuItem
        text={intl.get('delete_agent')}
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

function useAgentsTableColumns() {
  return React.useMemo(
    () => [
      {
        id: 'name',
        Header: intl.get('agent_name'),
        accessor: 'name',
        width: 220,
      },
      {
        id: 'cashAccount',
        Header: intl.get('agent_cash_account'),
        accessor: (row) => row.cashAccount?.name || '',
        width: 280,
      },
      {
        id: 'active',
        Header: intl.get('agent_active'),
        accessor: (row) =>
          row.active === false ? intl.get('inactive') : intl.get('active'),
        width: 120,
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

function SalesAgentsActionsBarInner({ openDialog }) {
  const handleNewClick = () => {
    openDialog(DialogsName.SalesAgentForm, {});
  };

  return (
    <DashboardActionsBar>
      <NavbarGroup>
        <Button
          className={Classes.MINIMAL}
          icon={<Icon icon="plus" />}
          text={<T id={'new_agent'} />}
          onClick={handleNewClick}
        />
      </NavbarGroup>
    </DashboardActionsBar>
  );
}
const SalesAgentsActionsBar = compose(withDialogActions)(
  SalesAgentsActionsBarInner,
);

function SalesAgentsTableInner({ openDialog }) {
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: salesAgents, isLoading, isFetching } = useSalesAgents();
  const { mutateAsync: deleteSalesAgent, isLoading: isDeleting } =
    useDeleteSalesAgent();

  const columns = useAgentsTableColumns();

  const handleEdit = (agent) => {
    openDialog(DialogsName.SalesAgentForm, {
      action: 'edit',
      id: agent.id,
    });
  };
  const handleDelete = (agent) => {
    setDeleteTarget(agent);
  };
  const handleCancelDelete = () => setDeleteTarget(null);
  const handleConfirmDelete = () => {
    deleteSalesAgent(deleteTarget.id)
      .then(() => {
        AppToaster.show({
          message: intl.get('the_agent_has_been_deleted_successfully'),
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
        data={salesAgents || []}
        loading={isLoading}
        headerLoading={isLoading}
        progressBarLoading={isFetching}
        expandable={false}
        sticky={true}
        TableLoadingRenderer={TableSkeletonRows}
        noResults={intl.get('there_is_no_agents_in_table_yet')}
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
          <FormattedHTMLMessage id={'once_delete_agent_cant_restore_data'} />
        </p>
      </Alert>
    </>
  );
}
const SalesAgentsTable = compose(withDialogActions)(SalesAgentsTableInner);

export function SalesAgentsList() {
  return (
    <DashboardInsider name={'sales-agents-list'}>
      <SalesAgentsActionsBar />
      <DashboardPageContent>
        <DashboardContentTable>
          <SalesAgentsTable />
        </DashboardContentTable>
      </DashboardPageContent>
    </DashboardInsider>
  );
}
