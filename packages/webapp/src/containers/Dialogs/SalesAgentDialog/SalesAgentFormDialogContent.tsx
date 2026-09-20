// @ts-nocheck
import React, { useMemo } from 'react';
import * as Yup from 'yup';
import intl from 'react-intl-universal';
import { Formik, Form } from 'formik';
import { Classes, Button, Intent, Checkbox } from '@blueprintjs/core';
import { useFormikContext } from 'formik';

import {
  AppToaster,
  DialogContent,
  FieldRequiredHint,
  FFormGroup,
  FInputGroup,
  FormattedMessage as T,
} from '@/components';
import { useAutofocus } from '@/hooks';
import { compose, transformToForm } from '@/utils';
import { DATATYPES_LENGTH } from '@/constants/dataTypes';
import { withDialogActions } from '@/containers/Dialog/withDialogActions';
import {
  useSalesAgent,
  useCreateSalesAgent,
  useEditSalesAgent,
} from '@/hooks/query';

const defaultInitialValues = {
  name: '',
  active: true,
};

const SalesAgentFormSchema = Yup.object().shape({
  name: Yup.string()
    .required()
    .max(DATATYPES_LENGTH.STRING)
    .label(intl.get('agent_name')),
  active: Yup.boolean(),
});

function SalesAgentFormFields() {
  const nameFieldRef = useAutofocus();
  const { values, setFieldValue } = useFormikContext();

  return (
    <div className={Classes.DIALOG_BODY}>
      <FFormGroup
        name={'name'}
        label={intl.get('agent_name')}
        labelInfo={<FieldRequiredHint />}
        inline
        fastField
      >
        <FInputGroup
          name={'name'}
          medium={true}
          inputRef={(ref) => (nameFieldRef.current = ref)}
          fastField
        />
      </FFormGroup>

      <FFormGroup name={'active'} label={intl.get('agent_active')} inline>
        <Checkbox
          checked={values.active !== false}
          onChange={(event) => setFieldValue('active', event.target.checked)}
        />
      </FFormGroup>
    </div>
  );
}

function SalesAgentFormFooterInner({
  isNewMode,
  dialogName,
  closeDialog,
}) {
  const { isSubmitting } = useFormikContext();

  return (
    <div className={Classes.DIALOG_FOOTER}>
      <div className={Classes.DIALOG_FOOTER_ACTIONS}>
        <Button disabled={isSubmitting} onClick={() => closeDialog(dialogName)}>
          <T id={'close'} />
        </Button>
        <Button intent={Intent.PRIMARY} type="submit" loading={isSubmitting}>
          {isNewMode ? <T id={'submit'} /> : <T id={'edit'} />}
        </Button>
      </div>
    </div>
  );
}
const SalesAgentFormFooter = compose(withDialogActions)(
  SalesAgentFormFooterInner,
);

function SalesAgentFormDialogContentInner({
  salesAgentId,
  dialogName,
  closeDialog,
}) {
  const isNewMode = !salesAgentId;

  const { data: salesAgent, isFetching: isSalesAgentLoading } = useSalesAgent(
    salesAgentId,
    { enabled: !!salesAgentId },
  );

  const { mutateAsync: createSalesAgentMutate } = useCreateSalesAgent();
  const { mutateAsync: editSalesAgentMutate } = useEditSalesAgent();

  const initialValues = useMemo(
    () => ({
      ...defaultInitialValues,
      ...transformToForm(salesAgent, defaultInitialValues),
    }),
    [salesAgent],
  );

  const transformErrors = (errors, { setErrors }) => {
    if (errors.find((error) => error.type === 'AGENT_NAME_EXISTS')) {
      setErrors({ name: intl.get('agent_name_exists') });
    }
  };

  const handleFormSubmit = (values, { setSubmitting, setErrors }) => {
    setSubmitting(true);
    const form = {
      name: values.name,
      active: values.active !== false,
    };

    const onSuccess = () => {
      AppToaster.show({
        message: intl.get(
          isNewMode
            ? 'the_agent_has_been_created_successfully'
            : 'the_agent_has_been_edited_successfully',
        ),
        intent: Intent.SUCCESS,
      });
      setSubmitting(false);
      closeDialog(dialogName);
    };
    const onError = (error) => {
      const errors = error?.response?.data?.errors || error?.data?.errors;
      if (errors) {
        transformErrors(errors, { setErrors });
      }
      setSubmitting(false);
    };

    if (isNewMode) {
      createSalesAgentMutate(form).then(onSuccess).catch(onError);
    } else {
      editSalesAgentMutate([salesAgentId, form])
        .then(onSuccess)
        .catch(onError);
    }
  };

  return (
    <DialogContent isLoading={isSalesAgentLoading} name={'sales-agent-form'}>
      <Formik
        validationSchema={SalesAgentFormSchema}
        initialValues={initialValues}
        enableReinitialize={true}
        onSubmit={handleFormSubmit}
      >
        <Form>
          <SalesAgentFormFields />
          <SalesAgentFormFooter isNewMode={isNewMode} dialogName={dialogName} />
        </Form>
      </Formik>
    </DialogContent>
  );
}

export const SalesAgentFormDialogContent = compose(withDialogActions)(
  SalesAgentFormDialogContentInner,
);
