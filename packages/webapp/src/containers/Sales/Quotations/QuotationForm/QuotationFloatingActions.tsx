// @ts-nocheck
import React from 'react';
import { Intent, Button } from '@blueprintjs/core';
import { useHistory } from 'react-router-dom';
import { useFormikContext } from 'formik';
import { FormattedMessage as T, Group, PageForm } from '@/components';
import { useQuotationFormContext } from './QuotationFormProvider';

export function QuotationFloatingActions() {
  const history = useHistory();
  const { resetForm, submitForm, isSubmitting } = useFormikContext();
  const { quotation, setSubmitPayload } = useQuotationFormContext();

  return (
    <PageForm.FooterActions spacing={10}>
      <Group spacing={10}>
        <Button
          disabled={isSubmitting}
          loading={isSubmitting}
          intent={Intent.PRIMARY}
          onClick={() => {
            setSubmitPayload({ redirect: true });
            submitForm();
          }}
          text={<T id={'save'} />}
        />
        <Button
          disabled={isSubmitting}
          onClick={() => resetForm()}
          text={quotation ? <T id={'reset'} /> : <T id={'clear'} />}
        />
        <Button
          disabled={isSubmitting}
          onClick={() => history.goBack()}
          text={<T id={'cancel'} />}
        />
      </Group>
    </PageForm.FooterActions>
  );
}
