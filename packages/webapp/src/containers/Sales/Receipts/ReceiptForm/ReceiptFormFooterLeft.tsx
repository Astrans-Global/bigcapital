// @ts-nocheck
import React from 'react';
import intl from 'react-intl-universal';
import styled from 'styled-components';
import { HTMLSelect } from '@blueprintjs/core';
import { useFormikContext } from 'formik';
import { FFormGroup, FEditableText, Stack } from '@/components';

const PAYMENT_MODES = [
  { value: '', label: 'Select…' },
  { value: 'CASH', label: 'CASH' },
  { value: 'BANK', label: 'BANK' },
];

export function ReceiptFormFooterLeft() {
  const { values, setFieldValue } = useFormikContext();

  return (
    <Stack spacing={20}>
      <ReceiptMsgFormGroup name={'note'} label={'Note'}>
        <FEditableText
          name={'note'}
          placeholder={'Additional information printed on the invoice.'}
          fastField
          multiline
        />
      </ReceiptMsgFormGroup>

      <ReceiptMsgFormGroup name={'receipt_message'} label={'Narration'}>
        <FEditableText
          name={'receipt_message'}
          placeholder={
            intl.get('receipt_form.receipt_message.placeholder') ||
            'This narration will be printed on the invoice.'
          }
          fastField
          multiline
        />
      </ReceiptMsgFormGroup>

      <TermsConditsFormGroup
        label={intl.get('receipt_form.label.terms_conditions')}
        name={'statement'}
      >
        <FEditableText
          name={'statement'}
          placeholder={intl.get(
            'receipt_form.terms_and_conditions.placeholder',
          )}
          multiline
          fastField
        />
      </TermsConditsFormGroup>

      <PaymentOptionsFormGroup
        label={'Mode of Payment'}
        name={'dms_payment_mode'}
      >
        <HTMLSelect
          fill
          value={values.dms_payment_mode || ''}
          onChange={(event) =>
            setFieldValue('dms_payment_mode', event.target.value)
          }
        >
          {PAYMENT_MODES.map((option) => (
            <option key={option.value || 'empty'} value={option.value}>
              {option.label}
            </option>
          ))}
        </HTMLSelect>
      </PaymentOptionsFormGroup>
    </Stack>
  );
}

const ReceiptMsgFormGroup = styled(FFormGroup)`
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

const PaymentOptionsFormGroup = styled(FFormGroup)`
  &.bp4-form-group {
    .bp4-label {
      font-weight: 500;
      font-size: 12px;
      margin-bottom: 10px;
    }
  }
`;
