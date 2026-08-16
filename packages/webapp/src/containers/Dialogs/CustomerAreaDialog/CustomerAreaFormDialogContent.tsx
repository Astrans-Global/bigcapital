// @ts-nocheck
import React, { useMemo } from 'react';
import * as Yup from 'yup';
import intl from 'react-intl-universal';
import { Formik, Form } from 'formik';
import { Classes, Button, Intent } from '@blueprintjs/core';
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
  useCustomerArea,
  useCreateCustomerArea,
  useEditCustomerArea,
} from '@/hooks/query';

const defaultInitialValues = {
  name: '',
  invoice_number_code: '',
  next_invoice_number: 10001,
};

const CustomerAreaFormSchema = Yup.object().shape({
  name: Yup.string()
    .required()
    .max(DATATYPES_LENGTH.STRING)
    .label(intl.get('area_name')),
  invoice_number_code: Yup.string()
    .trim()
    .required()
    .matches(/^[A-Za-z0-9]{2}$/, {
      message: intl.get('area_invoice_code_must_be_2_chars'),
    })
    .label(intl.get('area_invoice_code')),
  next_invoice_number: Yup.number()
    .integer()
    .min(1)
    .nullable(),
});

/**
 * Customer area form fields.
 */
function CustomerAreaFormFields() {
  const nameFieldRef = useAutofocus();

  return (
    <div className={Classes.DIALOG_BODY}>
      {/* ----------- Area name ----------- */}
      <FFormGroup
        name={'name'}
        label={intl.get('area_name')}
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

      {/* ----------- Invoice numbering code ----------- */}
      <FFormGroup
        name={'invoice_number_code'}
        label={intl.get('area_invoice_code')}
        labelInfo={<FieldRequiredHint />}
        helperText={intl.get('area_invoice_code_hint')}
        inline
        fastField
      >
        <FInputGroup name={'invoice_number_code'} maxLength={2} fastField />
      </FFormGroup>

      {/* ----------- Next invoice number ----------- */}
      <FFormGroup
        name={'next_invoice_number'}
        label={intl.get('area_next_invoice_number')}
        helperText={intl.get('area_next_invoice_number_hint')}
        inline
        fastField
      >
        <FInputGroup name={'next_invoice_number'} type={'number'} fastField />
      </FFormGroup>
    </div>
  );
}

/**
 * Customer area form footer.
 */
function CustomerAreaFormFooterInner({
  isNewMode,
  dialogName,
  // #withDialogActions
  closeDialog,
}) {
  const { isSubmitting } = useFormikContext();

  const handleCloseBtnClick = () => {
    closeDialog(dialogName);
  };

  return (
    <div className={Classes.DIALOG_FOOTER}>
      <div className={Classes.DIALOG_FOOTER_ACTIONS}>
        <Button disabled={isSubmitting} onClick={handleCloseBtnClick}>
          <T id={'close'} />
        </Button>

        <Button intent={Intent.PRIMARY} type="submit" loading={isSubmitting}>
          {isNewMode ? <T id={'submit'} /> : <T id={'edit'} />}
        </Button>
      </div>
    </div>
  );
}
const CustomerAreaFormFooter = compose(withDialogActions)(
  CustomerAreaFormFooterInner,
);

/**
 * Customer area form dialog content.
 */
function CustomerAreaFormDialogContentInner({
  // #ownProps
  customerAreaId,
  dialogName,

  // #withDialogActions
  closeDialog,
}) {
  const isNewMode = !customerAreaId;

  const { data: customerArea, isFetching: isCustomerAreaLoading } =
    useCustomerArea(customerAreaId, { enabled: !!customerAreaId });

  const { mutateAsync: createCustomerAreaMutate } = useCreateCustomerArea();
  const { mutateAsync: editCustomerAreaMutate } = useEditCustomerArea();

  const initialValues = useMemo(
    () => ({
      ...defaultInitialValues,
      ...transformToForm(customerArea, defaultInitialValues),
    }),
    [customerArea],
  );

  const transformErrors = (errors, { setErrors }) => {
    if (errors.find((error) => error.type === 'AREA_NAME_EXISTS')) {
      setErrors({ name: intl.get('area_name_exists') });
    }
    if (errors.find((error) => error.type === 'AREA_CODE_EXISTS')) {
      setErrors({ invoice_number_code: intl.get('area_invoice_code_exists') });
    }
  };

  const handleFormSubmit = (values, { setSubmitting, setErrors }) => {
    setSubmitting(true);
    const form = {
      name: values.name,
      invoiceNumberCode: values.invoice_number_code || undefined,
      nextInvoiceNumber: values.next_invoice_number || undefined,
    };

    const afterSubmit = () => {
      closeDialog(dialogName);
    };
    const onSuccess = () => {
      AppToaster.show({
        message: intl.get(
          isNewMode
            ? 'the_area_has_been_created_successfully'
            : 'the_area_has_been_edited_successfully',
        ),
        intent: Intent.SUCCESS,
      });
      setSubmitting(false);
      afterSubmit();
    };
    const onError = (error) => {
      const errors = error?.response?.data?.errors || error?.data?.errors;
      if (errors) {
        transformErrors(errors, { setErrors });
      }
      setSubmitting(false);
    };

    if (isNewMode) {
      createCustomerAreaMutate(form).then(onSuccess).catch(onError);
    } else {
      editCustomerAreaMutate([customerAreaId, form])
        .then(onSuccess)
        .catch(onError);
    }
  };

  return (
    <DialogContent isLoading={isCustomerAreaLoading} name={'customer-area-form'}>
      <Formik
        validationSchema={CustomerAreaFormSchema}
        initialValues={initialValues}
        enableReinitialize={true}
        onSubmit={handleFormSubmit}
      >
        <Form>
          <CustomerAreaFormFields />
          <CustomerAreaFormFooter isNewMode={isNewMode} dialogName={dialogName} />
        </Form>
      </Formik>
    </DialogContent>
  );
}

export const CustomerAreaFormDialogContent = compose(withDialogActions)(
  CustomerAreaFormDialogContentInner,
);
