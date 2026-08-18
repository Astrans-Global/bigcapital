import React from 'react';
import intl from 'react-intl-universal';
import { Group, PageFormBigNumber } from '@/components';
import { InvoiceFormHeaderFields } from './InvoiceFormHeaderFields';
import { InvoiceFormCustomerDuePanel } from './InvoiceFormCustomerDuePanel';
import { useInvoiceTotalFormatted } from './utils';
import styles from './InvoiceFormHeader.module.scss';

/**
 * Invoice form header section.
 */
export function InvoiceFormHeader() {
  return (
    <Group
      position="apart"
      align={'flex-start'}
      noWrap
      p="25px 32px"
      className={styles.root}
    >
      <InvoiceFormHeaderFields />
      <InvoiceFormCustomerDuePanel />
      <InvoiceFormBigTotal />
    </Group>
  );
}

/**
 * Big total of invoice form header.
 * @returns {React.ReactNode}
 */
function InvoiceFormBigTotal() {
  // Calculate the total due amount of invoice entries.
  const totalFormatted = useInvoiceTotalFormatted();

  return (
    <div style={{ flexShrink: 0 }}>
      <PageFormBigNumber label={intl.get('due_amount')} amount={totalFormatted} />
    </div>
  );
}
