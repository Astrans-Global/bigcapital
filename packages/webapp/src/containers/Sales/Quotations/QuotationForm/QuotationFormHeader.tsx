// @ts-nocheck
import React from 'react';
import styled from 'styled-components';
import { QuotationFormHeaderFields } from './QuotationFormHeaderFields';
import { QuotationStatutoryDownload } from './QuotationStatutoryDownload';
import { Group, PageFormBigNumber } from '@/components';
import { useQuotationTotalFormatted } from './utils';
import { useIsDarkMode } from '@/hooks/useDarkMode';

export function QuotationFormHeader() {
  const isDarkMode = useIsDarkMode();
  const totalFormatted = useQuotationTotalFormatted();

  return (
    <Group
      position="apart"
      align={'stretch'}
      noWrap
      p="25px 32px"
      style={{
        background: isDarkMode ? 'var(--color-dark-gray1)' : 'var(--color-white)',
        borderBottom: isDarkMode
          ? '1px solid rgba(255, 255, 255, 0.1)'
          : '1px solid #d2dce2',
      }}
    >
      <QuotationFormHeaderFields />
      <HeaderPreviewColumn>
        <QuotationStatutoryDownload />
      </HeaderPreviewColumn>
      <div style={{ flexShrink: 0, alignSelf: 'flex-start' }}>
        <PageFormBigNumber label={'Amount'} amount={totalFormatted} />
      </div>
    </Group>
  );
}

const HeaderPreviewColumn = styled.div`
  flex: 1 1 auto;
  min-width: 220px;
`;
