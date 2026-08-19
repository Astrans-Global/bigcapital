// @ts-nocheck
import React from 'react';
import intl from 'react-intl-universal';
import styled from 'styled-components';
import { CreditNoteFormHeaderFields } from './CreditNoteFormHeaderFields';
import { CreditNoteStatutoryDownload } from './CreditNoteStatutoryDownload';
import { Group, PageFormBigNumber } from '@/components';
import { useCreditNoteTotalFormatted } from './utils';
import { useIsDarkMode } from '@/hooks/useDarkMode';

/**
 * Credit note header: customer/date fields on the left, statutory
 * download in the middle, total on the right.
 */
export function CreditNoteFormHeader() {
  const isDarkMode = useIsDarkMode();

  return (
    <Group
      position="apart"
      align={'stretch'}
      noWrap
      display="flex"
      p="25px 32px"
      bg="var(--x-credit-note-form-header-background)"
      borderBottom="1px solid var(--x-credit-note-form-header-border)"
      style={{
        '--x-credit-note-form-header-background': isDarkMode
          ? 'var(--color-dark-gray1)'
          : 'var(--color-white)',
        '--x-credit-note-form-header-border': isDarkMode
          ? 'rgba(255, 255, 255, 0.1)'
          : '#d2dce2',
      }}
    >
      <CreditNoteFormHeaderFields />
      <HeaderPreviewColumn>
        <CreditNoteStatutoryDownload />
      </HeaderPreviewColumn>
      <CreditNoteFormBigNumber />
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

/**
 * Big total number of credit note form header.
 * @returns {React.ReactNode}
 */
function CreditNoteFormBigNumber() {
  const totalFormatted = useCreditNoteTotalFormatted();

  return (
    <div style={{ flexShrink: 0, alignSelf: 'flex-start' }}>
      <PageFormBigNumber
        label={intl.get('credit_note.label_amount_to_credit')}
        amount={totalFormatted}
      />
    </div>
  );
}
