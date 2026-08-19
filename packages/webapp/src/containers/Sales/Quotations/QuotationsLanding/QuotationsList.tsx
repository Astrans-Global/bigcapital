// @ts-nocheck
import React from 'react';
import { useHistory } from 'react-router-dom';
import { Button, Intent, Menu, MenuItem, MenuDivider } from '@blueprintjs/core';
import {
  DashboardInsider,
  DashboardPageContent,
  DataTable,
  FormattedMessage as T,
  Icon,
  AppToaster,
} from '@/components';
import { useQuotations, useDeleteQuotation } from '@/hooks/query';

export function QuotationsList() {
  const history = useHistory();
  const { data, isLoading } = useQuotations();
  const { mutateAsync: deleteQuotation } = useDeleteQuotation();
  const quotations = data?.quotations || [];

  const columns = [
    {
      Header: 'Quotation #',
      accessor: (row) => row.quotation_number || row.quotationNumber,
      width: 140,
    },
    {
      Header: 'Date',
      accessor: (row) => row.quotation_date || row.quotationDate,
      width: 120,
    },
    {
      Header: 'Company Name',
      accessor: (row) => row.company_name || row.companyName,
      width: 220,
    },
    {
      Header: 'Amount',
      accessor: 'amount',
      width: 120,
    },
    {
      Header: '',
      accessor: 'actions',
      width: 80,
      Cell: ({ row: { original } }) => (
        <Menu>
          <MenuItem
            icon={<Icon icon="pen-18" />}
            text="Edit"
            onClick={() => history.push(`/quotations/${original.id}/edit`)}
          />
          <MenuDivider />
          <MenuItem
            text="Delete"
            intent={Intent.DANGER}
            onClick={async () => {
              try {
                await deleteQuotation(original.id);
                AppToaster.show({
                  message: 'Quotation deleted.',
                  intent: Intent.SUCCESS,
                });
              } catch (error) {
                AppToaster.show({
                  message: 'Could not delete this quotation.',
                  intent: Intent.DANGER,
                });
              }
            }}
          />
        </Menu>
      ),
    },
  ];

  return (
    <DashboardInsider loading={isLoading} name={'quotations-list'}>
      <DashboardPageContent>
        <div style={{ padding: '16px 24px' }}>
          <Button
            intent={Intent.PRIMARY}
            onClick={() => history.push('/quotations/new')}
          >
            New Quotation
          </Button>
        </div>
        <DataTable
          columns={columns}
          data={quotations}
          loading={isLoading}
          onCellClick={(cell) =>
            history.push(`/quotations/${cell.row.original.id}/edit`)
          }
        />
      </DashboardPageContent>
    </DashboardInsider>
  );
}
