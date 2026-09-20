// @ts-nocheck
import React, { useMemo } from 'react';
import * as Yup from 'yup';
import intl from 'react-intl-universal';
import { Formik, Form } from 'formik';
import { Classes, Button, Intent } from '@blueprintjs/core';
import moment from 'moment';

import {
  AppToaster,
  DialogContent,
  FieldRequiredHint,
  FFormGroup,
  FDateInput,
  AccountsSelect,
  FormattedMessage as T,
  Money,
} from '@/components';
import { compose } from '@/utils';
import { withDialogActions } from '@/containers/Dialog/withDialogActions';
import { useAccounts, useDepositCashPayment } from '@/hooks/query';
import { ACCOUNT_TYPE } from '@/constants/accountTypes';

const DepositSchema = Yup.object().shape({
  bankAccountId: Yup.number().required(),
  depositDate: Yup.date().required(),
});

function DepositCashPaymentDialogContentInner({
  dialogName,
  paymentReceiveId,
  amount,
  currencyCode,
  closeDialog,
}) {
  const { data: accounts, isLoading } = useAccounts();
  const { mutateAsync: depositMutate } = useDepositCashPayment();

  const initialValues = useMemo(
    () => ({
      bankAccountId: '',
      depositDate: moment().format('YYYY-MM-DD'),
    }),
    [],
  );

  const handleSubmit = (values, { setSubmitting }) => {
    depositMutate({
      id: paymentReceiveId,
      bankAccountId: Number(values.bankAccountId),
      depositDate: moment(values.depositDate).format('YYYY-MM-DD'),
    })
      .then(() => {
        AppToaster.show({
          message: intl.get('the_cash_payment_has_been_deposited'),
          intent: Intent.SUCCESS,
        });
        setSubmitting(false);
        closeDialog(dialogName);
      })
      .catch(() => {
        setSubmitting(false);
      });
  };

  return (
    <DialogContent isLoading={isLoading} name={'deposit-cash-payment'}>
      <Formik
        validationSchema={DepositSchema}
        initialValues={initialValues}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting }) => (
          <Form>
            <div className={Classes.DIALOG_BODY}>
              {amount != null && (
                <p>
                  {intl.get('amount')}:{' '}
                  <Money amount={amount} currency={currencyCode} />
                </p>
              )}
              <FFormGroup
                name={'bankAccountId'}
                label={intl.get('deposit_to_bank')}
                labelInfo={<FieldRequiredHint />}
                inline
              >
                <AccountsSelect
                  name={'bankAccountId'}
                  items={accounts || []}
                  filterByTypes={[ACCOUNT_TYPE.BANK]}
                  fill
                />
              </FFormGroup>
              <FFormGroup
                name={'depositDate'}
                label={intl.get('date')}
                labelInfo={<FieldRequiredHint />}
                inline
              >
                <FDateInput
                  name={'depositDate'}
                  formatDate={(date) => moment(date).format('YYYY-MM-DD')}
                  parseDate={(str) => new Date(str)}
                  fill
                />
              </FFormGroup>
            </div>
            <div className={Classes.DIALOG_FOOTER}>
              <div className={Classes.DIALOG_FOOTER_ACTIONS}>
                <Button
                  disabled={isSubmitting}
                  onClick={() => closeDialog(dialogName)}
                >
                  <T id={'cancel'} />
                </Button>
                <Button
                  intent={Intent.PRIMARY}
                  type="submit"
                  loading={isSubmitting}
                >
                  <T id={'mark_deposited'} />
                </Button>
              </div>
            </div>
          </Form>
        )}
      </Formik>
    </DialogContent>
  );
}

export const DepositCashPaymentDialogContent = compose(withDialogActions)(
  DepositCashPaymentDialogContentInner,
);
