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
import {
  useAccounts,
  useDepositPdCheque,
  useRealizePdCheque,
} from '@/hooks/query';
import { ACCOUNT_TYPE } from '@/constants/accountTypes';

const Schema = Yup.object().shape({
  bankAccountId: Yup.number().required(),
  realizeDate: Yup.date().nullable(),
});

function PdChequeStatusDialogContentInner({
  dialogName,
  action,
  chequeId,
  amount,
  currencyCode,
  closeDialog,
}) {
  const isRealize = action === 'realize';
  const { data: accounts, isLoading } = useAccounts();
  const { mutateAsync: depositMutate } = useDepositPdCheque();
  const { mutateAsync: realizeMutate } = useRealizePdCheque();

  const initialValues = useMemo(
    () => ({
      bankAccountId: '',
      realizeDate: moment().format('YYYY-MM-DD'),
    }),
    [],
  );

  const handleSubmit = (values, { setSubmitting }) => {
    const payload = {
      id: chequeId,
      bankAccountId: Number(values.bankAccountId),
      realizeDate: moment(values.realizeDate).format('YYYY-MM-DD'),
    };
    const request = isRealize ? realizeMutate(payload) : depositMutate(payload);

    request
      .then(() => {
        AppToaster.show({
          message: intl.get(
            isRealize
              ? 'the_cheque_has_been_realized'
              : 'the_cheque_has_been_deposited',
          ),
          intent: Intent.SUCCESS,
        });
        setSubmitting(false);
        closeDialog(dialogName);
      })
      .catch(() => setSubmitting(false));
  };

  return (
    <DialogContent isLoading={isLoading} name={'pd-cheque-status'}>
      <Formik
        validationSchema={Schema}
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
              {isRealize && (
                <FFormGroup
                  name={'realizeDate'}
                  label={intl.get('date')}
                  labelInfo={<FieldRequiredHint />}
                  inline
                >
                  <FDateInput
                    name={'realizeDate'}
                    formatDate={(date) => moment(date).format('YYYY-MM-DD')}
                    parseDate={(str) => new Date(str)}
                    fill
                  />
                </FFormGroup>
              )}
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
                  {isRealize ? (
                    <T id={'realize_cheque'} />
                  ) : (
                    <T id={'mark_deposited'} />
                  )}
                </Button>
              </div>
            </div>
          </Form>
        )}
      </Formik>
    </DialogContent>
  );
}

export const PdChequeStatusDialogContent = compose(withDialogActions)(
  PdChequeStatusDialogContentInner,
);
