// @ts-nocheck
import React from 'react';
import intl from 'react-intl-universal';
import styled from 'styled-components';
import { Group, PageFormBigNumber } from '@/components';
import { ReceiptFormHeader as ReceiptFormHeaderFields } from './ReceiptFormHeaderFields';
import { ReceiptStatutoryDownload } from './ReceiptStatutoryDownload';
import { useReceiptTotalFormatted } from './utils';
import { useIsDarkMode } from '@/hooks/useDarkMode';

/**
 * Receipt form header: customer/date fields on the left, statutory
 * download in the middle, total on the right.
 */
export function ReceiptFormHeader({
  onReceiptNumberChanged,
}) {
  const isDarkMode = useIsDarkMode();

  return (
    <Group
      position="apart"
      align={'stretch'}
      noWrap
      display="flex"
      p="25px 32px"
      bg="var(--x-header-background)"
      borderBottom="1px solid var(--x-header-border)"
      style={{
        '--x-header-background': isDarkMode
          ? 'var(--color-dark-gray1)'
          : 'var(--color-white)',
        '--x-header-border': isDarkMode
          ? 'rgba(255, 255, 255, 0.1)'
          : '#d2dce2',
      }}
    >
      <ReceiptFormHeaderFields
        onReceiptNumberChanged={onReceiptNumberChanged}
      />
      <HeaderPreviewColumn>
        <ReceiptStatutoryDownload />
      </HeaderPreviewColumn>
      <ReceiptFormHeaderBigTotal />
    </Group>
  );
}

const HeaderPreviewColumn = styled.div`
  flex: 1 1 auto;
  min-width: 280px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

function ReceiptFormHeaderBigTotal() {
  const totalFormatted = useReceiptTotalFormatted();

  return (
    <div style={{ flexShrink: 0, alignSelf: 'flex-start' }}>
      <PageFormBigNumber label={intl.get('total')} amount={totalFormatted} />
    </div>
  );
}
