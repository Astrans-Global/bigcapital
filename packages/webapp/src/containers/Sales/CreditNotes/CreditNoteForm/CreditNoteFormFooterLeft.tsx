// @ts-nocheck
import React from 'react';
import intl from 'react-intl-universal';
import styled from 'styled-components';
import { FFormGroup, FEditableText, Stack } from '@/components';

export function CreditNoteFormFooterLeft() {
  return (
    <Stack spacing={20}>
      <CreditNoteMsgFormGroup name={'note'} label={'Note'}>
        <FEditableText
          name={'note'}
          placeholder={'Additional information printed on the credit note.'}
          multiline
          fastField
        />
      </CreditNoteMsgFormGroup>

      <CreditNoteMsgFormGroup name={'credit_note_message'} label={'Narration'}>
        <FEditableText
          name={'credit_note_message'}
          placeholder={'This narration will be printed on the credit note.'}
          multiline
          fastField
        />
      </CreditNoteMsgFormGroup>

      <TermsConditsFormGroup
        label={intl.get('credit_note.label_terms_conditions')}
        name={'terms_conditions'}
      >
        <FEditableText
          name={'terms_conditions'}
          placeholder={intl.get(
            'credit_note.label_terms_and_conditions.placeholder',
          )}
          multiline
          fastField
        />
      </TermsConditsFormGroup>
    </Stack>
  );
}

const CreditNoteMsgFormGroup = styled(FFormGroup)`
  &.bp4-form-group {
    .bp4-label {
      font-size: 12px;
      margin-bottom: 12px;
    }
    .bp4-form-content {
      margin-left: 10px;
    }
  }
`;

const TermsConditsFormGroup = styled(FFormGroup)`
  &.bp4-form-group {
    .bp4-label {
      font-size: 12px;
      margin-bottom: 12px;
    }
    .bp4-form-content {
      margin-left: 10px;
    }
  }
`;
