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
  FSelect,
  FormattedMessage as T,
} from '@/components';
import { useAutofocus } from '@/hooks';
import { compose, transformToForm } from '@/utils';
import { DATATYPES_LENGTH } from '@/constants/dataTypes';
import { withDialogActions } from '@/containers/Dialog/withDialogActions';
import {
  useCustomerRouteCity,
  useCreateCustomerRouteCity,
  useEditCustomerRouteCity,
  useCustomerAreas,
} from '@/hooks/query';

const defaultInitialValues = {
  name: '',
  area_id: '',
};

const RouteCityFormSchema = Yup.object().shape({
  name: Yup.string()
    .required()
    .max(DATATYPES_LENGTH.STRING)
    .label(intl.get('route_city_name')),
  area_id: Yup.number().required().label(intl.get('area')),
});

/**
 * Customer route city form fields.
 */
function CustomerRouteCityFormFields({ customerAreas }) {
  const nameFieldRef = useAutofocus();

  return (
    <div className={Classes.DIALOG_BODY}>
      {/* ----------- Area ----------- */}
      <FFormGroup
        name={'area_id'}
        label={intl.get('area')}
        labelInfo={<FieldRequiredHint />}
        inline
        fastField
      >
        <FSelect
          name={'area_id'}
          items={customerAreas}
          valueAccessor={'id'}
          textAccessor={'name'}
          placeholder={<T id={'select_area'} />}
          popoverProps={{ minimal: true, captureDismiss: true }}
        />
      </FFormGroup>

      {/* ----------- Route city name ----------- */}
      <FFormGroup
        name={'name'}
        label={intl.get('route_city_name')}
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
    </div>
  );
}

/**
 * Customer route city form footer.
 */
function CustomerRouteCityFormFooterInner({
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
const CustomerRouteCityFormFooter = compose(withDialogActions)(
  CustomerRouteCityFormFooterInner,
);

/**
 * Customer route city form dialog content.
 */
function CustomerRouteCityFormDialogContentInner({
  // #ownProps
  customerRouteCityId,
  dialogName,
  areaId,

  // #withDialogActions
  closeDialog,
}) {
  const isNewMode = !customerRouteCityId;

  const { data: customerRouteCity, isFetching: isCustomerRouteCityLoading } =
    useCustomerRouteCity(customerRouteCityId, {
      enabled: !!customerRouteCityId,
    });

  const { data: customerAreas, isLoading: isCustomerAreasLoading } =
    useCustomerAreas();

  const { mutateAsync: createCustomerRouteCityMutate } =
    useCreateCustomerRouteCity();
  const { mutateAsync: editCustomerRouteCityMutate } =
    useEditCustomerRouteCity();

  const initialValues = useMemo(() => {
    const values = {
      ...defaultInitialValues,
      ...transformToForm(
        {
          ...customerRouteCity,
          area_id: customerRouteCity?.areaId,
        },
        defaultInitialValues,
      ),
    };
    // In new mode, pre-select the area the dialog was opened from (if any).
    if (!customerRouteCity && areaId) {
      values.area_id = areaId;
    }
    values.area_id = values.area_id ?? '';

    return values;
  }, [customerRouteCity, areaId]);

  const transformErrors = (errors, { setErrors }) => {
    if (errors.find((error) => error.type === 'ROUTE_CITY_NAME_EXISTS')) {
      setErrors({ name: intl.get('route_city_name_exists') });
    }
  };

  const handleFormSubmit = (values, { setSubmitting, setErrors }) => {
    setSubmitting(true);
    const form = {
      name: values.name,
      areaId: values.area_id,
    };

    const afterSubmit = () => {
      closeDialog(dialogName);
    };
    const onSuccess = () => {
      AppToaster.show({
        message: intl.get(
          isNewMode
            ? 'the_route_city_has_been_created_successfully'
            : 'the_route_city_has_been_edited_successfully',
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
      createCustomerRouteCityMutate(form).then(onSuccess).catch(onError);
    } else {
      editCustomerRouteCityMutate([customerRouteCityId, form])
        .then(onSuccess)
        .catch(onError);
    }
  };

  return (
    <DialogContent
      isLoading={isCustomerRouteCityLoading || isCustomerAreasLoading}
      name={'customer-route-city-form'}
    >
      <Formik
        validationSchema={RouteCityFormSchema}
        initialValues={initialValues}
        enableReinitialize={true}
        onSubmit={handleFormSubmit}
      >
        <Form>
          <CustomerRouteCityFormFields customerAreas={customerAreas || []} />
          <CustomerRouteCityFormFooter
            isNewMode={isNewMode}
            dialogName={dialogName}
          />
        </Form>
      </Formik>
    </DialogContent>
  );
}

export const CustomerRouteCityFormDialogContent = compose(withDialogActions)(
  CustomerRouteCityFormDialogContentInner,
);
