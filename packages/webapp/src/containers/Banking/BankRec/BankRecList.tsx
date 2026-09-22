// @ts-nocheck
import React from 'react';
import { useHistory } from 'react-router-dom';
import {
  Button,
  Intent,
  Menu,
  MenuItem,
  MenuDivider,
  Popover,
  Position,
  Tag,
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
  AppToaster,
} from '@/components';
import {
  useBankRecs,
  useReopenBankRec,
  useDeleteBankRec,
} from '@/hooks/query';
import { toastBankRecErrors } from './bankRecErrors';

function money(value) {
  return Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function field(row, camel, snake) {
  return row?.[camel] ?? row?.[snake];
}

function formatDate(value) {
  return value ? moment(value).format('YYYY-MM-DD') : '';
}

function ActionsMenu({ rec, onOpen, onReopen, onDelete }) {
  const status = field(rec, 'status', 'status');
  const canReopen = field(rec, 'canReopen', 'can_reopen');
  return (
    <Menu>
      <MenuItem
        icon={<Icon icon="reader-18" />}
        text={status === 'closed' ? 'View' : 'Open'}
        onClick={() => onOpen(rec)}
      />
      {canReopen && (
        <MenuItem text="Reopen last Rec" onClick={() => onReopen(rec)} />
      )}
      {status === 'draft' && (
        <>
          <MenuDivider />
          <MenuItem
            intent={Intent.DANGER}
            icon={<Icon icon="trash-16" iconSize={16} />}
            text="Delete draft"
            onClick={() => onDelete(rec)}
          />
        </>
      )}
    </Menu>
  );
}

function ActionsCell({ row: { original }, payload }) {
  return (
    <Popover
      content={
        <ActionsMenu
          rec={original}
          onOpen={payload.onOpen}
          onReopen={payload.onReopen}
          onDelete={payload.onDelete}
        />
      }
      position={Position.RIGHT_BOTTOM}
    >
      <Button icon={<Icon icon="more-h-16" iconSize={16} />} minimal />
    </Popover>
  );
}

function useBankRecColumns() {
  return React.useMemo(
    () => [
      {
        id: 'accountName',
        Header: 'Bank',
        accessor: (row) => field(row, 'accountName', 'account_name') || '',
        width: 180,
        clickable: true,
      },
      {
        id: 'periodMonth',
        Header: 'Month',
        accessor: (row) => field(row, 'periodMonth', 'period_month') || '',
        width: 90,
        clickable: true,
      },
      {
        id: 'startDate',
        Header: 'Start',
        accessor: (row) => formatDate(field(row, 'startDate', 'start_date')),
        width: 110,
        clickable: true,
      },
      {
        id: 'endDate',
        Header: 'End',
        accessor: (row) => formatDate(field(row, 'endDate', 'end_date')),
        width: 110,
        clickable: true,
      },
      {
        id: 'status',
        Header: 'Status',
        accessor: (row) => (
          <Tag
            minimal
            round
            intent={row.status === 'closed' ? Intent.SUCCESS : Intent.WARNING}
          >
            {row.status === 'closed' ? 'Closed' : 'Draft'}
          </Tag>
        ),
        width: 90,
      },
      {
        id: 'difference',
        Header: 'Difference',
        accessor: (row) => money(row.difference),
        align: 'right',
        width: 120,
      },
      {
        id: 'actions',
        Header: '',
        Cell: ActionsCell,
        width: 44,
        disableResizing: true,
        className: 'actions',
      },
    ],
    [],
  );
}

export default function BankRecList() {
  const history = useHistory();
  const { data, isLoading } = useBankRecs();
  const { mutateAsync: reopen } = useReopenBankRec();
  const { mutateAsync: remove } = useDeleteBankRec();
  const rows = data?.data || [];
  const columns = useBankRecColumns();

  const handleNew = () => history.push('/bank-recs/new');
  const handleOpen = (rec) => history.push(`/bank-recs/${rec.id}`);

  const handleReopen = async (rec) => {
    try {
      await reopen(rec.id);
      AppToaster.show({
        intent: Intent.SUCCESS,
        message: 'Last Rec reopened. Ticks were kept.',
      });
      history.push(`/bank-recs/${rec.id}`);
    } catch (error) {
      toastBankRecErrors(error?.response?.data?.errors);
    }
  };

  const handleDelete = async (rec) => {
    try {
      await remove(rec.id);
      AppToaster.show({ intent: Intent.SUCCESS, message: 'Draft Rec deleted.' });
    } catch (error) {
      toastBankRecErrors(error?.response?.data?.errors);
    }
  };

  return (
    <DashboardInsider name="bank-recs">
      <DashboardActionsBar>
        <Button intent={Intent.PRIMARY} onClick={handleNew}>
          New Rec
        </Button>
      </DashboardActionsBar>
      <DashboardPageContent>
        <DashboardContentTable>
          <DataTable
            noInitialFetch={true}
            columns={columns}
            data={rows}
            loading={isLoading}
            headerLoading={isLoading}
            TableLoadingRenderer={TableSkeletonRows}
            onRowClick={handleOpen}
            noResults="No bank reconciliations yet."
            payload={{
              onOpen: handleOpen,
              onReopen: handleReopen,
              onDelete: handleDelete,
            }}
          />
        </DashboardContentTable>
      </DashboardPageContent>
    </DashboardInsider>
  );
}
