// @ts-nocheck
import React from 'react';
import intl from 'react-intl-universal';
import styled from 'styled-components';

import { EstimateFormHeader as EstimateFormHeaderFields } from './EstimateFormHeaderFields';
import { EstimateStatutoryDownload } from './EstimateStatutoryDownload';
import { Group, PageFormBigNumber } from '@/components';
import { useEstimateTotalFormatted } from './utils';
import { useIsDarkMode } from '@/hooks/useDarkMode';

export function EstimateFormHeader() {
  const isDarkMode = useIsDarkMode();

  return (
    <Group
      position="apart"
      align={'stretch'}
      noWrap
      p="25px 32px"
      bg="var(--x-estimate-form-header-background)"
      borderBottom="1px solid var(--x-estimate-form-header-border)"
      style={{
        '--x-estimate-form-header-background': isDarkMode
          ? 'var(--color-dark-gray1)'
          : 'var(--color-white)',
        '--x-estimate-form-header-border': isDarkMode
          ? 'rgba(255, 255, 255, 0.1)'
          : '#d2dce2',
      }}
    >
      <EstimateFormHeaderFields />
      <HeaderPreviewColumn>
        <EstimateStatutoryDownload />
      </HeaderPreviewColumn>
      <EstimateFormBigTotal />
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

function EstimateFormBigTotal() {
  const totalFormatted = useEstimateTotalFormatted();

  return (
    <div style={{ flexShrink: 0, alignSelf: 'flex-start' }}>
      <PageFormBigNumber label={intl.get('amount')} amount={totalFormatted} />
    </div>
  );
}
