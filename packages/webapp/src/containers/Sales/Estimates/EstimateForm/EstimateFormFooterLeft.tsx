// @ts-nocheck
import React from 'react';
import intl from 'react-intl-universal';
import styled from 'styled-components';
import { FFormGroup, FEditableText } from '@/components';
import { ESTIMATE_DEFAULT_NOTE } from './utils';

export function EstimateFormFooterLeft() {
  return (
    <React.Fragment>
      <EstimateMsgFormGroup
        name={'note'}
        label={intl.get('estimate_form.label.customer_note') || 'Notes'}
      >
        <FEditableText
          name={'note'}
          placeholder={ESTIMATE_DEFAULT_NOTE}
          multiline
          fastField
        />
      </EstimateMsgFormGroup>
    </React.Fragment>
  );
}

const EstimateMsgFormGroup = styled(FFormGroup)`
  &.bp4-form-group {
    margin-bottom: 40px;

    .bp4-label {
      font-size: 12px;
      margin-bottom: 12px;
    }
    .bp4-form-content {
      margin-left: 10px;
    }
  }
`;
