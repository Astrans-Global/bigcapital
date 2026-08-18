import React from 'react';
import intl from 'react-intl-universal';
import styled from 'styled-components';
import { Group, PageFormBigNumber } from '@/components';
import { InvoiceFormHeaderFields } from './InvoiceFormHeaderFields';
import { InvoiceFormCustomerDuePanel } from './InvoiceFormCustomerDuePanel';
import { InvoiceStatutoryDownload } from './InvoiceStatutoryDownload';
import { useInvoiceTotalFormatted } from './utils';
import styles from './InvoiceFormHeader.module.scss';

/**
 * Invoice form header: customer/date fields on the left, statutory
 * download + outstanding-invoices panel in the middle (the empty zone
 * next to those fields), Due Amount on the right.
 */
export function InvoiceFormHeader() {
  return (
    <Group
      position="apart"
      align={'stretch'}
      noWrap
      p="25px 32px"
      className={styles.root}
    >
      <InvoiceFormHeaderFields />
      <HeaderPreviewColumn>
        <InvoiceStatutoryDownload />
        <InvoiceFormCustomerDuePanel />
      </HeaderPreviewColumn>
      <InvoiceFormBigTotal />
    </Group>
  );
}

const HeaderPreviewColumn = styled.div`
  flex: 1 1 auto;
  min-width: 320px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
`;

/**
 * Big total of invoice form header.
 * @returns {React.ReactNode}
 */
function InvoiceFormBigTotal() {
  const totalFormatted = useInvoiceTotalFormatted();

  return (
    <div style={{ flexShrink: 0, alignSelf: 'flex-start' }}>
      <PageFormBigNumber label={intl.get('due_amount')} amount={totalFormatted} />
    </div>
  );
}
