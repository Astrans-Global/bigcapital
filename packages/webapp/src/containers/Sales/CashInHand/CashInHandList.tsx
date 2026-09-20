// @ts-nocheck
import React, { useMemo, useState } from 'react';
import intl from 'react-intl-universal';
import {
  NavbarGroup,
  Button,
  Classes,
  Menu,
  MenuItem,
  Popover,
  Position,
  HTMLSelect,
  FormGroup,
} from '@blueprintjs/core';
import moment from 'moment';

import {
  DashboardInsider,
  DashboardPageContent,
  DashboardContentTable,
  DashboardActionsBar,
  DataTable,
  TableSkeletonRows,
  Icon,
  FormattedMessage as T,
  Money,
} from '@/components';
import {
  useCashInHand,
  useCustomerAreas,
  useSalesAgents,
} from '@/hooks/query';
import { withDialogActions } from '@/containers/Dialog/withDialogActions';
import { DialogsName } from '@/constants/dialogs';
import { compose, safeCallback } from '@/utils';

function ActionMenuList({
  row: { original },
  payload: { onDeposit },
}) {
  return (
    <Menu>
      <MenuItem
        icon={<Icon icon="check" />}
        text={intl.get('mark_deposited')}
        onClick={safeCallback(onDeposit, original)}
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

function useCashInHandColumns() {
  return useMemo(
    () => [
      {
        id: 'paymentReceiveNo',
        Header: intl.get('payment_received_no'),
        accessor: 'paymentReceiveNo',
        width: 140,
      },
      {
        id: 'paymentDate',
        Header: intl.get('payment_date'),
        accessor: (row) =>
          row.paymentDate
            ? moment(row.paymentDate).format('YYYY-MM-DD')
            : '',
        width: 120,
      },
      {
        id: 'customerName',
        Header: intl.get('customer_name'),
        accessor: 'customerName',
        width: 180,
      },
      {
        id: 'areaName',
        Header: intl.get('area'),
        accessor: 'areaName',
        width: 120,
      },
      {
        id: 'agentName',
        Header: intl.get('agent'),
        accessor: 'agentName',
        width: 140,
      },
      {
        id: 'invoiceNo',
        Header: intl.get('invoice_no'),
        accessor: 'invoiceNo',
        width: 120,
      },
      {
        id: 'paymentAmount',
        Header: intl.get('amount'),
        accessor: (row) => (
          <Money amount={row.paymentAmount} currency={row.currencyCode} />
        ),
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

function CashInHandActionsBarInner({ areaId, agentId, onAreaChange, onAgentChange }) {
  const { data: areas } = useCustomerAreas();
  const { data: agents } = useSalesAgents();

  return (
    <DashboardActionsBar>
      <NavbarGroup>
        <FormGroup label={intl.get('area')} inline style={{ marginBottom: 0 }}>
          <HTMLSelect
            value={areaId}
            onChange={(event) => onAreaChange(event.target.value)}
          >
            <option value="">{intl.get('all')}</option>
            {(areas || []).map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </HTMLSelect>
        </FormGroup>
        <FormGroup
          label={intl.get('agent')}
          inline
          style={{ marginBottom: 0, marginLeft: 12 }}
        >
          <HTMLSelect
            value={agentId}
            onChange={(event) => onAgentChange(event.target.value)}
          >
            <option value="">{intl.get('all')}</option>
            {(agents || [])
              .filter((agent) => agent.active !== false)
              .map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
          </HTMLSelect>
        </FormGroup>
      </NavbarGroup>
    </DashboardActionsBar>
  );
}

function CashInHandTableInner({ areaId, agentId, openDialog }) {
  const query = {
    ...(areaId ? { areaId: Number(areaId) } : {}),
    ...(agentId ? { agentId: Number(agentId) } : {}),
  };
  const { data: rows, isLoading, isFetching } = useCashInHand(query);
  const columns = useCashInHandColumns();

  const handleDeposit = (row) => {
    openDialog(DialogsName.DepositCashPayment, {
      paymentReceiveId: row.paymentReceiveId || row.id,
      amount: row.amount,
      currencyCode: row.currencyCode,
    });
  };

  return (
    <DataTable
      noInitialFetch={true}
      columns={columns}
      data={rows || []}
      loading={isLoading}
      headerLoading={isLoading}
      progressBarLoading={isFetching}
      expandable={false}
      sticky={true}
      TableLoadingRenderer={TableSkeletonRows}
      noResults={intl.get('there_is_no_cash_in_hand')}
      payload={{ onDeposit: handleDeposit }}
      ContextMenu={ActionMenuList}
    />
  );
}
const CashInHandTable = compose(withDialogActions)(CashInHandTableInner);

export function CashInHandList() {
  const [areaId, setAreaId] = useState('');
  const [agentId, setAgentId] = useState('');

  return (
    <DashboardInsider name={'cash-in-hand-list'}>
      <CashInHandActionsBarInner
        areaId={areaId}
        agentId={agentId}
        onAreaChange={setAreaId}
        onAgentChange={setAgentId}
      />
      <DashboardPageContent>
        <DashboardContentTable>
          <CashInHandTable areaId={areaId} agentId={agentId} />
        </DashboardContentTable>
      </DashboardPageContent>
    </DashboardInsider>
  );
}
