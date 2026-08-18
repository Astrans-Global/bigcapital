// @ts-nocheck
import React from 'react';
import moment from 'moment';
import styled from 'styled-components';
import intl from 'react-intl-universal';
import type { CustomerDueInvoiceRow } from '@bigcapital/sdk-ts';
import { formattedAmount } from '@/utils';

/**
 * Outstanding delivered invoices for a customer (Invoice No, date, due
 * amount, days from invoice date). See docs/ops/PHASE1.md ("Customers").
 */
export function CustomerDueInvoicesTable({
  invoices,
  currencyCode,
  emptyHint,
}: {
  invoices?: CustomerDueInvoiceRow[];
  currencyCode?: string;
  emptyHint?: string;
}) {
  if (!invoices?.length) {
    return (
      <EmptyHint>
        {emptyHint ||
          intl.get('customer.due_invoices.empty') ||
          'No outstanding delivered invoices.'}
      </EmptyHint>
    );
  }

  return (
    <Table>
      <thead>
        <tr>
          <th>{intl.get('invoice_no') || 'Invoice No'}</th>
          <th>{intl.get('invoice_date') || 'Invoice date'}</th>
          <th className="align-right">{intl.get('due_amount') || 'Due Amount'}</th>
          <th className="align-right">
            {intl.get('customer.due_invoices.days_due') || 'Days Due'}
          </th>
        </tr>
      </thead>
      <tbody>
        {invoices.map((row) => (
          <tr key={row.saleInvoiceId}>
            <td>{row.invoiceNo || '—'}</td>
            <td>
              {row.invoiceDate
                ? moment(row.invoiceDate).format('MM/DD/YYYY')
                : '—'}
            </td>
            <td className="align-right">
              {formattedAmount(row.dueAmount, currencyCode || 'LKR')}
            </td>
            <td className="align-right">{row.daysDue}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;

  th,
  td {
    padding: 4px 8px 4px 0;
    text-align: left;
    white-space: nowrap;
  }
  th {
    opacity: 0.65;
    font-weight: 500;
    position: sticky;
    top: 0;
    background: var(--color-invoice-form-header-background, inherit);
  }
  .align-right {
    text-align: right;
  }
`;

const EmptyHint = styled.div`
  font-size: 12px;
  opacity: 0.6;
  padding: 8px 0;
`;
