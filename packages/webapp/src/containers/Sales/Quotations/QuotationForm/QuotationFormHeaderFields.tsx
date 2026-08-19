// @ts-nocheck
import React from 'react';
import { Position } from '@blueprintjs/core';
import { css } from '@emotion/css';
import { Theme, useTheme } from '@emotion/react';
import {
  FFormGroup,
  FieldRequiredHint,
  Icon,
  Stack,
  FDateInput,
  FInputGroup,
} from '@/components';
import intl from 'react-intl-universal';

const getFieldsStyle = (theme: Theme) => css`
  .${theme.bpPrefix}-form-group {
    margin-bottom: 0;
    &.${theme.bpPrefix}-inline {
      max-width: 470px;
    }
    .${theme.bpPrefix}-label {
      min-width: 160px;
      font-weight: 500;
    }
    .${theme.bpPrefix}-form-content {
      width: 100%;
    }
  }
`;

export function QuotationFormHeaderFields() {
  const theme = useTheme();

  return (
    <Stack spacing={18} flex={1} className={getFieldsStyle(theme)}>
      <FFormGroup
        name={'company_name'}
        label={'Company Name'}
        labelInfo={<FieldRequiredHint />}
        inline
      >
        <FInputGroup name={'company_name'} minimal />
      </FFormGroup>

      <FFormGroup name={'address_to'} label={'Address To'} inline>
        <FInputGroup name={'address_to'} minimal />
      </FFormGroup>

      <FFormGroup name={'address_line_1'} label={'Address Line 1'} inline>
        <FInputGroup name={'address_line_1'} minimal />
      </FFormGroup>

      <FFormGroup name={'address_line_2'} label={'Address Line 2'} inline>
        <FInputGroup name={'address_line_2'} minimal />
      </FFormGroup>

      <FFormGroup
        name={'quotation_date'}
        label={intl.get('date') || 'Date'}
        labelInfo={<FieldRequiredHint />}
        inline
      >
        <FDateInput
          name={'quotation_date'}
          formatDate={(date) => date.toLocaleDateString()}
          parseDate={(str) => new Date(str)}
          popoverProps={{ position: Position.BOTTOM_LEFT, minimal: true }}
          inputProps={{
            leftIcon: <Icon icon={'date-range'} />,
            fill: true,
          }}
          fill
        />
      </FFormGroup>

      <FFormGroup name={'quotation_number'} label={'Quotation #'} inline>
        <FInputGroup name={'quotation_number'} minimal disabled />
      </FFormGroup>
    </Stack>
  );
}
