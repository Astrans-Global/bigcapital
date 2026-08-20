// @ts-nocheck
import React, { useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import { Intent } from '@blueprintjs/core';
import { isEmpty } from 'lodash';
import {
  DashboardInsider,
  DashboardPageContent,
  DataTable,
  DashboardContentTable,
  TableSkeletonRows,
  TableSkeletonHeader,
  AppToaster,
} from '@/components';
import { TABLES } from '@/constants/tables';
import { useMemorizedColumnsWidths } from '@/hooks';
import { useQuotations, useDeleteQuotation } from '@/hooks/query';
import { QuotationsActionsBar } from './QuotationsActionsBar';
import { QuotationsEmptyStatus } from './QuotationsEmptyStatus';
import { ActionsMenu, useQuotationsTableColumns } from './components';

import '@/style/pages/SaleEstimate/List.scss';

export function QuotationsList() {
  const history = useHistory();
  const [tableState, setTableState] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const { data, isLoading, isFetching } = useQuotations({
    page: tableState.pageIndex + 1,
    pageSize: tableState.pageSize,
  });
  const { mutateAsync: deleteQuotation } = useDeleteQuotation();
  const quotations = data?.quotations || [];
  const pagination = data?.pagination;
  const isEmptyStatus = !isLoading && isEmpty(quotations);
  const columns = useQuotationsTableColumns();
  const [initialColumnsWidths, , handleColumnResizing] =
    useMemorizedColumnsWidths(TABLES.QUOTATIONS);

  const handleEditQuotation = (quotation) => {
    history.push(`/quotations/${quotation.id}/edit`);
  };

  const handleDeleteQuotation = async ({ id }) => {
    if (!window.confirm('Delete this quotation? This cannot be undone.')) {
      return;
    }
    try {
      await deleteQuotation(id);
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
  };

  const handleFetchData = useCallback(({ pageIndex, pageSize }) => {
    setTableState((current) => {
      if (current.pageIndex === pageIndex && current.pageSize === pageSize) {
        return current;
      }
      return { pageIndex, pageSize };
    });
  }, []);

  return (
    <DashboardInsider name={'quotations-list'}>
      <QuotationsActionsBar />

      <DashboardPageContent>
        {isEmptyStatus ? (
          <QuotationsEmptyStatus />
        ) : (
          <DashboardContentTable>
            <DataTable
              columns={columns}
              data={quotations}
              loading={isLoading}
              headerLoading={isLoading}
              progressBarLoading={isFetching}
              onFetchData={handleFetchData}
              noInitialFetch={true}
              sticky={true}
              pagination={true}
              initialPageSize={tableState.pageSize}
              manualPagination={true}
              rowsCount={pagination?.total ?? 0}
              TableLoadingRenderer={TableSkeletonRows}
              TableHeaderSkeletonRenderer={TableSkeletonHeader}
              ContextMenu={ActionsMenu}
              onCellClick={(cell) =>
                history.push(`/quotations/${cell.row.original.id}/edit`)
              }
              initialColumnsWidths={initialColumnsWidths}
              onColumnResizing={handleColumnResizing}
              payload={{
                onEdit: handleEditQuotation,
                onDelete: handleDeleteQuotation,
              }}
            />
          </DashboardContentTable>
        )}
      </DashboardPageContent>
    </DashboardInsider>
  );
}
