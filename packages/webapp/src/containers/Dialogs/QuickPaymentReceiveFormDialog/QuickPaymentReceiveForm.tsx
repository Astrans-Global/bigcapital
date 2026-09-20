// @ts-nocheck
import React from 'react';
import intl from 'react-intl-universal';
import { Formik } from 'formik';
import { Intent } from '@blueprintjs/core';
import { defaultTo, omit } from 'lodash';

import { AppToaster } from '@/components';
import { useQuickPaymentReceiveContext } from './QuickPaymentReceiveFormProvider';
import { CreateQuickPaymentReceiveFormSchema } from './QuickPaymentReceive.schema';
import { QuickPaymentReceiveFormContent } from './QuickPaymentReceiveFormContent';

import { withSettings } from '@/containers/Settings/withSettings';
import { withDialogActions } from '@/containers/Dialog/withDialogActions';
import {
  defaultInitialValues,
  transformErrors,
  transformInvoiceToForm,
} from './utils';
import { compose } from '@/utils';
import { previewCollectionNumber } from '@/containers/Sales/PaymentsReceived/PaymentReceiveForm/collectionNumber';

/**
 * Quick payment receive form.
 */
function QuickPaymentReceiveFormInner({
  // #withDialogActions
  closeDialog,

  // #withSettings
  preferredDepositAccount,
  bankDepositNumberSettings,
}) {
  const { dialogName, invoice, createPaymentReceiveMutate } =
    useQuickPaymentReceiveContext();

  const nextPaymentNumber = previewCollectionNumber(
    'bank_deposit',
    bankDepositNumberSettings,
  );

  const initialValues = {
    ...defaultInitialValues,
    payment_receive_no: nextPaymentNumber,
    payment_method: 'bank_deposit',
    deposit_account_id: defaultTo(preferredDepositAccount, ''),
    ...transformInvoiceToForm(invoice),
  };

  const handleFormSubmit = (values, { setSubmitting, setFieldError }) => {
    const entries = [
      {
        invoice_id: values.invoice_id,
        payment_amount: values.amount,
      },
    ];
    const form = {
      ...omit(values, ['payment_receive_no', 'invoice_id']),
      payment_method: 'bank_deposit',
      entries,
    };

    const onSaved = () => {
      AppToaster.show({
        message: intl.get('the_payment_received_transaction_has_been_created'),
        intent: Intent.SUCCESS,
      });
      closeDialog(dialogName);
    };
    const onError = ({ data: { errors } }) => {
      if (errors) {
        transformErrors(errors, { setFieldError });
      }
      setSubmitting(false);
    };
    createPaymentReceiveMutate(form).then(onSaved).catch(onError);
  };

  return (
    <Formik
      validationSchema={CreateQuickPaymentReceiveFormSchema}
      initialValues={initialValues}
      onSubmit={handleFormSubmit}
      component={QuickPaymentReceiveFormContent}
    />
  );
}

export const QuickPaymentReceiveForm = compose(
  withDialogActions,
  withSettings(
    ({ paymentReceiveSettings, paymentReceivesBankDepositSettings }) => ({
      preferredDepositAccount: paymentReceiveSettings?.preferredDepositAccount,
      bankDepositNumberSettings: paymentReceivesBankDepositSettings,
    }),
  ),
)(QuickPaymentReceiveFormInner);
