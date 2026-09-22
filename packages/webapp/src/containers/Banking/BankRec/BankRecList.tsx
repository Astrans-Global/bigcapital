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

function ActionsMenu({ rec, onOpen, onReopen, onDelete }) {
  return (
    <Menu>
      <MenuItem
        icon={<Icon icon="reader-18" />}
        text={rec.status === 'closed' ? 'View' : 'Open'}
        onClick={() => onOpen(rec)}
      />
      {rec.can_reopen && (
        <MenuItem text="Reopen last Rec" onClick={() => onReopen(rec)} />
      )}
      {rec.status === 'draft' && (
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

export default function BankRecList() {
  const history = useHistory();
  const { data, isLoading } = useBankRecs();
  const { mutateAsync: reopen } = useReopenBankRec();
  const { mutateAsync: remove } = useDeleteBankRec();
  const rows = data?.data || [];

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

  const columns = React.useMemo(
    () => [
      { Header: 'Bank', accessor: 'account_name', width: 180 },
      { Header: 'Month', accessor: 'period_month', width: 90 },
      {
        Header: 'Start',
        accessor: (row) => moment(row.start_date).format('YYYY-MM-DD'),
        width: 110,
      },
      {
        Header: 'End',
        accessor: (row) => moment(row.end_date).format('YYYY-MM-DD'),
        width: 110,
      },
      {
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
        Header: 'Difference',
        accessor: (row) => money(row.difference),
        align: 'right',
        width: 120,
      },
      {
        Header: '',
        width: 44,
        accessor: (row) => (
          <Popover
            content={
              <ActionsMenu
                rec={row}
                onOpen={handleOpen}
                onReopen={handleReopen}
                onDelete={handleDelete}
              />
            }
            position={Position.RIGHT_BOTTOM}
          >
            <Button icon={<Icon icon="more-h-16" iconSize={16} />} />
          </Popover>
        ),
      },
    ],
    [],
  );

  return (
    <DashboardInsider loading={isLoading} name="bank-recs">
      <DashboardActionsBar>
        <Button intent={Intent.PRIMARY} onClick={handleNew}>
          New Rec
        </Button>
      </DashboardActionsBar>
      <DashboardPageContent>
        <DashboardContentTable>
          <DataTable
            columns={columns}
            data={rows}
            loading={isLoading}
            ProgressBar={TableSkeletonRows}
            onRowClick={handleOpen}
            noResults="No bank reconciliations yet."
          />
        </DashboardContentTable>
      </DashboardPageContent>
    </DashboardInsider>
  );
}
