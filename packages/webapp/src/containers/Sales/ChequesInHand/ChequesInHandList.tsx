// @ts-nocheck
import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
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
  HTMLSelect,
  FormGroup,
  Checkbox,
  NavbarDivider,
  InputGroup,
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
  AppToaster,
  ListSelect,
} from '@/components';
import {
  usePdCheques,
  useCustomerAreas,
  useCustomers,
  useReturnPdCheque,
  useExportPdCheques,
} from '@/hooks/query';
import { withDialogActions } from '@/containers/Dialog/withDialogActions';
import { DialogsName } from '@/constants/dialogs';
import { compose, safeCallback } from '@/utils';
import { downloadFile } from '@/hooks/useDownloadFile';

const STATUSES = ['pending', 'deposited', 'realized', 'returned'];

function ActionMenuList({
  row: { original },
  payload: { onDeposit, onRealize, onReturn },
}) {
  const status = original.status;
  return (
    <Menu>
      {(status === 'pending' || status === 'deposited') && (
        <>
          {status === 'pending' && (
            <MenuItem
              text={intl.get('mark_deposited')}
              onClick={safeCallback(onDeposit, original)}
            />
          )}
          <MenuItem
            text={intl.get('realize_cheque')}
            onClick={safeCallback(onRealize, original)}
          />
          <MenuDivider />
          <MenuItem
            text={intl.get('return_cheque')}
            intent={Intent.DANGER}
            onClick={safeCallback(onReturn, original)}
          />
        </>
      )}
    </Menu>
  );
}

function TableActionsCell(props) {
  if (
    props.row.original.status === 'realized' ||
    props.row.original.status === 'returned'
  ) {
    return null;
  }
  return (
    <Popover content={<ActionMenuList {...props} />} position={Position.RIGHT_TOP}>
      <Button icon={<Icon icon="more-h-16" iconSize={16} />} minimal />
    </Popover>
  );
}

function useChequesColumns() {
  return useMemo(
    () => [
      {
        id: 'customerName',
        Header: intl.get('customer_name'),
        accessor: 'customerName',
        width: 180,
      },
      {
        id: 'invoiceNumbers',
        Header: intl.get('invoice_no'),
        accessor: 'invoiceNumbers',
        width: 200,
      },
      {
        id: 'documentNo',
        Header: intl.get('cheque_document_no'),
        accessor: 'documentNo',
        width: 130,
      },
      {
        id: 'chequeNo',
        Header: intl.get('cheque_number'),
        accessor: 'chequeNo',
        width: 120,
      },
      {
        id: 'collectedDate',
        Header: intl.get('collected_date'),
        accessor: (row) =>
          row.collectedDate
            ? moment(row.collectedDate).format('YYYY-MM-DD')
            : '',
        width: 120,
      },
      {
        id: 'bankingDate',
        Header: intl.get('banking_date'),
        accessor: (row) =>
          row.bankingDate ? moment(row.bankingDate).format('YYYY-MM-DD') : '',
        width: 120,
      },
      {
        id: 'status',
        Header: intl.get('status'),
        accessor: (row) =>
          intl.get(`cheque_status.${row.status}`) || row.status,
        width: 110,
      },
      {
        id: 'amount',
        Header: intl.get('amount'),
        accessor: (row) => (
          <Money amount={row.amount} currency={row.currencyCode} />
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

function ChequesInHandListInner({ openDialog }) {
  const [areaId, setAreaId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [bankingDateFrom, setBankingDateFrom] = useState('');
  const [bankingDateTo, setBankingDateTo] = useState('');
  const [sortBy, setSortBy] = useState('bankingDate');
  const [statuses, setStatuses] = useState([]);
  const [chequeNo, setChequeNo] = useState('');
  const [returnTarget, setReturnTarget] = useState(null);

  const { data: areas } = useCustomerAreas();
  const { data: customersData } = useCustomers({ page_size: 10000 });
  const customers = customersData?.data || [];
  const { mutateAsync: returnCheque, isLoading: isReturning } =
    useReturnPdCheque();
  const exporters = useExportPdCheques();

  const query = {
    ...(areaId ? { areaId: Number(areaId) } : {}),
    ...(customerId ? { customerId: Number(customerId) } : {}),
    ...(bankingDateFrom ? { bankingDateFrom } : {}),
    ...(bankingDateTo ? { bankingDateTo } : {}),
    ...(statuses.length ? { status: statuses.join(',') } : {}),
    ...(chequeNo.trim() ? { chequeNo: chequeNo.trim() } : {}),
    sortBy,
  };

  const { data, isLoading, isFetching } = usePdCheques(query);
  const rows = data?.rows || [];
  const total = data?.total || 0;
  const columns = useChequesColumns();

  const allCustomersItem = useMemo(
    () => ({
      id: '',
      display_name: intl.get('all_customers'),
    }),
    [],
  );

  const filteredCustomers = useMemo(() => {
    if (!areaId) {
      return [allCustomersItem];
    }
    return [
      allCustomersItem,
      ...customers
        .filter(
          (customer) =>
            Number(customer.area_id ?? customer.areaId) === Number(areaId),
        )
        .map((customer) => ({
          ...customer,
          display_name: customer.display_name || customer.displayName,
        })),
    ];
  }, [allCustomersItem, areaId, customers]);

  const handleStatusToggle = (status) => {
    setStatuses((current) =>
      current.includes(status)
        ? current.filter((item) => item !== status)
        : [...current, status],
    );
  };

  const handleDeposit = (row) => {
    openDialog(DialogsName.PdChequeStatus, {
      action: 'deposit',
      id: row.id,
      amount: row.amount,
      currencyCode: row.currencyCode,
    });
  };
  const handleRealize = (row) => {
    openDialog(DialogsName.PdChequeStatus, {
      action: 'realize',
      id: row.id,
      amount: row.amount,
      currencyCode: row.currencyCode,
    });
  };

  const handleExport = (kind) => {
    const request = kind === 'xlsx' ? exporters.xlsx(query) : exporters.pdf(query);
    request.then((res) => {
      downloadFile(
        res.data,
        kind === 'xlsx' ? 'cheques-in-hand.xlsx' : 'cheques-in-hand.pdf',
        kind === 'xlsx'
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'application/pdf',
      );
    });
  };

  return (
    <DashboardInsider name={'cheques-in-hand-list'}>
      <DashboardActionsBar>
        <NavbarGroup align="right">
          <Button
            className={Classes.MINIMAL}
            icon={<Icon icon="file-export" />}
            text={intl.get('export_to_excel')}
            onClick={() => handleExport('xlsx')}
          />
          <NavbarDivider />
          <Button
            className={Classes.MINIMAL}
            icon={<Icon icon="print-16" />}
            text="PDF"
            onClick={() => handleExport('pdf')}
          />
        </NavbarGroup>
      </DashboardActionsBar>
      <ChequesFilterBar>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <FormGroup label={intl.get('area')} inline style={{ marginBottom: 0 }}>
            <HTMLSelect
              value={areaId}
              onChange={(event) => {
                setAreaId(event.target.value);
                setCustomerId('');
              }}
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
            label={intl.get('customer_name')}
            inline
            style={{ marginBottom: 0, flex: '1 1 380px', minWidth: 380, maxWidth: 640 }}
          >
            <ListSelect
              key={areaId || 'all-areas'}
              items={filteredCustomers}
              selectedItem={customerId}
              selectedItemProp="id"
              textProp="display_name"
              defaultText={intl.get('all_customers')}
              filterable={true}
              popoverProps={{ minimal: true, usePortal: true, fill: true }}
              className="cheques-in-hand-customer-select"
              onItemSelect={(item) =>
                setCustomerId(item?.id === '' || item?.id == null ? '' : item.id)
              }
            />
          </FormGroup>
          <FormGroup
            label={intl.get('cheque_number')}
            inline
            style={{ marginBottom: 0 }}
          >
            <InputGroup
              value={chequeNo}
              maxLength={6}
              placeholder="000000"
              className="cheques-in-hand-cheque-no"
              onChange={(event) =>
                setChequeNo(event.target.value.replace(/\D/g, '').slice(0, 6))
              }
            />
          </FormGroup>
          <FormGroup
            label={intl.get('banking_date')}
            inline
            style={{ marginBottom: 0 }}
          >
            <input
              type="date"
              value={bankingDateFrom}
              onChange={(event) => setBankingDateFrom(event.target.value)}
              className={Classes.INPUT}
            />
            <span style={{ margin: '0 6px' }}>–</span>
            <input
              type="date"
              value={bankingDateTo}
              onChange={(event) => setBankingDateTo(event.target.value)}
              className={Classes.INPUT}
            />
          </FormGroup>
        </div>
        <FormGroup
          label={intl.get('status')}
          inline
          style={{ marginBottom: 0 }}
        >
          {STATUSES.map((status) => (
            <Checkbox
              key={status}
              inline
              checked={statuses.includes(status)}
              label={intl.get(`cheque_status.${status}`)}
              onChange={() => handleStatusToggle(status)}
            />
          ))}
        </FormGroup>
      </ChequesFilterBar>
      <DashboardPageContent>
        <DashboardContentTable>
          <DataTable
            noInitialFetch={true}
            columns={columns}
            data={rows}
            loading={isLoading}
            headerLoading={isLoading}
            progressBarLoading={isFetching}
            expandable={false}
            sticky={true}
            TableLoadingRenderer={TableSkeletonRows}
            noResults={intl.get('there_is_no_cheques_in_hand')}
            payload={{
              onDeposit: handleDeposit,
              onRealize: handleRealize,
              onReturn: setReturnTarget,
            }}
            ContextMenu={ActionMenuList}
          />
          <div style={{ padding: 12, fontWeight: 600 }}>
            {intl.get('total')}: <Money amount={total} />
          </div>
        </DashboardContentTable>
      </DashboardPageContent>

      <Alert
        cancelButtonText={<T id={'cancel'} />}
        confirmButtonText={<T id={'return_cheque'} />}
        icon="warning-sign"
        intent={Intent.DANGER}
        isOpen={!!returnTarget}
        loading={isReturning}
        onCancel={() => setReturnTarget(null)}
        onConfirm={() => {
          returnCheque(returnTarget.id)
            .then(() => {
              AppToaster.show({
                message: intl.get('the_cheque_has_been_returned'),
                intent: Intent.SUCCESS,
              });
            })
            .finally(() => setReturnTarget(null));
        }}
      >
        <p>{intl.get('the_cheque_has_been_returned')}</p>
      </Alert>
    </DashboardInsider>
  );
}

const ChequesFilterBar = styled.div`
  padding: 10px 16px 12px;
  border-bottom: 1px solid #e1e4e8;
  display: flex;
  flex-direction: column;
  gap: 10px;

  .cheques-in-hand-customer-select {
    width: 100%;
    min-width: 320px;
  }

  .cheques-in-hand-customer-select .bp4-button {
    width: 100%;
    justify-content: flex-start;
  }

  .cheques-in-hand-cheque-no {
    width: 88px;
  }
`;

export const ChequesInHandList = compose(withDialogActions)(
  ChequesInHandListInner,
);
