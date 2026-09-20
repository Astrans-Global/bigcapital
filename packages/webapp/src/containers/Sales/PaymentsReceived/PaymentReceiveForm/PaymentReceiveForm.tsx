// @ts-nocheck
import React from 'react';
import { isEmpty, defaultTo } from 'lodash';
import intl from 'react-intl-universal';
import { Formik, Form } from 'formik';
import { useHistory } from 'react-router-dom';
import { Intent } from '@blueprintjs/core';
import { css } from '@emotion/css';

import { PaymentReceiveFormHeader as PaymentReceiveHeader } from './PaymentReceiveFormHeader';
import { PaymentReceiveFormBody } from './PaymentReceiveFormBody';
import { PaymentReceiveFormFloatingActions as PaymentReceiveFloatingActions } from './PaymentReceiveFloatingActions';
import { PaymentReceiveFormFooter } from './PaymentReceiveFormFooter';
import { PaymentReceiveFormAlerts } from './PaymentReceiveFormAlerts';
import { PaymentReceiveFormDialogs } from './PaymentReceiveFormDialogs';
import { PaymentReceiveFormTopBar } from './PaymentReceiveFormTopBar';
import { PaymentReceiveInnerProvider } from './PaymentReceiveInnerProvider';

import { withSettings } from '@/containers/Settings/withSettings';
import { withDialogActions } from '@/containers/Dialog/withDialogActions';

import {
  EditPaymentReceiveFormSchema,
  CreatePaymentReceiveFormSchema,
} from './PaymentReceiveForm.schema';
import { AppToaster } from '@/components';
import { compose } from '@/utils';
import { useCurrentOrganizationBaseCurrency } from '@/hooks/query';

import { usePaymentReceiveFormContext } from './PaymentReceiveFormProvider';
import {
  defaultPaymentReceive,
  transformToEditForm,
  transformFormToRequest,
  transformErrors,
  resetFormState,
  getExceededAmountFromValues,
} from './utils';
import { PaymentReceiveSyncIncrementSettingsToForm } from './components';
import { PageForm } from '@/components/PageForm';

/**
 * Payment Receive form.
 */
function PaymentReceiveFormRoot({
  // #withSettings
  preferredDepositAccount,

  // #withDialogActions
  openDialog,
}) {
  const baseCurrency = useCurrentOrganizationBaseCurrency();

  const history = useHistory();

  // Payment receive form context.
  const {
    isNewMode,
    paymentReceiveEditPage,
    paymentEntriesEditPage,
    paymentReceiveId,
    submitPayload,
    editPaymentReceiveMutate,
    createPaymentReceiveMutate,
    createPdChequeMutate,
    isExcessConfirmed,
    paymentReceivedState,
  } = usePaymentReceiveFormContext();

  // Payment receive number is assigned on the server.
  const initialValues = {
    ...(!isEmpty(paymentReceiveEditPage)
      ? transformToEditForm(paymentReceiveEditPage, paymentEntriesEditPage)
      : {
          ...defaultPaymentReceive,
          deposit_account_id: defaultTo(preferredDepositAccount, ''),
          currency_code: baseCurrency,
          pdf_template_id: paymentReceivedState?.defaultTemplateId,
        }),
  };
  // Handle form submit.
  const handleSubmitForm = (
    values,
    { setSubmitting, resetForm, setFieldError },
  ) => {
    setSubmitting(true);
    const exceededAmount = getExceededAmountFromValues(values);

    // Validates the amount should be bigger than zero.
    if (values.amount <= 0) {
      AppToaster.show({
        message: intl.get('you_cannot_make_payment_with_zero_total_amount'),
        intent: Intent.DANGER,
      });
      setSubmitting(false);
      return;
    }
    // Show the confirm popup if the excessed amount bigger than zero and
    // excess confirmation has not been confirmed yet. Cheque leftover is
    // parked in Customer Advances, so skip this dialog for PD cheques.
    if (
      values.payment_method !== 'pd_cheque' &&
      exceededAmount > 0 &&
      !isExcessConfirmed
    ) {
      setSubmitting(false);
      openDialog('payment-received-excessed-payment');
      return;
    }
    // Transformes the form values to request body.
    const form = transformFormToRequest(values);

    // Handle request response success.
    const onSaved = () => {
      setSubmitting(false);
      AppToaster.show({
        message: intl.get(
          values.payment_method === 'pd_cheque'
            ? 'the_cheque_has_been_created'
            : paymentReceiveId
            ? 'the_payment_received_transaction_has_been_edited'
            : 'the_payment_received_transaction_has_been_created',
        ),
        intent: Intent.SUCCESS,
      });

      if (submitPayload.redirect) {
        history.push(
          values.payment_method === 'pd_cheque'
            ? '/cheques-in-hand'
            : '/payments-received',
        );
      }
      if (submitPayload.resetForm) {
        resetFormState({ resetForm, initialValues, values });
      }
    };
    // Handle request response errors.
    const onError = ({ data: { errors } }) => {
      if (errors) {
        transformErrors(errors, { setFieldError });
      }
      setSubmitting(false);
    };

    if (values.payment_method === 'pd_cheque') {
      const chequeForm = {
        customer_id: form.customer_id,
        cheque_no: values.cheque_no,
        amount: form.amount,
        collected_date: form.payment_date,
        banking_date: values.banking_date,
        entries: form.entries,
        exchange_rate: form.exchange_rate,
        reference_no: form.reference_no,
        statement: form.statement,
        branch_id: form.branch_id,
      };
      return createPdChequeMutate(chequeForm).then(onSaved).catch(onError);
    }

    if (paymentReceiveId) {
      return editPaymentReceiveMutate([paymentReceiveId, form])
        .then(onSaved)
        .catch(onError);
    } else {
      return createPaymentReceiveMutate(form).then(onSaved).catch(onError);
    }
  };

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmitForm}
      validationSchema={
        isNewMode
          ? CreatePaymentReceiveFormSchema
          : EditPaymentReceiveFormSchema
      }
    >
      <Form
        className={css({
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
        })}
      >
        <PageForm flex={1}>
          <PaymentReceiveInnerProvider>
            <PageForm.Body>
              <PaymentReceiveFormTopBar />
              <PaymentReceiveHeader />
              <PaymentReceiveFormBody />
              <PaymentReceiveFormFooter />
            </PageForm.Body>

            <PageForm.Footer>
              <PaymentReceiveFloatingActions />
            </PageForm.Footer>

            {/* ------- Effects ------- */}
            <PaymentReceiveSyncIncrementSettingsToForm />

            {/* ------- Alerts & Dialogs ------- */}
            <PaymentReceiveFormAlerts />
            <PaymentReceiveFormDialogs />
          </PaymentReceiveInnerProvider>
        </PageForm>
      </Form>
    </Formik>
  );
}

export const PaymentReceivedForm = compose(
  withSettings(({ paymentReceiveSettings }) => ({
    paymentReceiveSettings,
    preferredDepositAccount: paymentReceiveSettings?.preferredDepositAccount,
  })),
  withDialogActions,
)(PaymentReceiveFormRoot);
