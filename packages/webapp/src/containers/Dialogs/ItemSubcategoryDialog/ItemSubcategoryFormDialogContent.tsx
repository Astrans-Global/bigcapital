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
  FTextArea,
  FormattedMessage as T,
} from '@/components';
import { useAutofocus } from '@/hooks';
import { compose, transformToForm } from '@/utils';
import { DATATYPES_LENGTH } from '@/constants/dataTypes';
import { withDialogActions } from '@/containers/Dialog/withDialogActions';
import {
  useItemSubcategory,
  useCreateItemSubcategory,
  useEditItemSubcategory,
  useItemsCategories,
} from '@/hooks/query';

const defaultInitialValues = {
  name: '',
  description: '',
  category_id: '',
};

const SubcategoryFormSchema = Yup.object().shape({
  name: Yup.string()
    .required()
    .max(DATATYPES_LENGTH.STRING)
    .label(intl.get('subcategory_name')),
  description: Yup.string().trim().max(DATATYPES_LENGTH.TEXT).nullable(),
  category_id: Yup.number().required().label(intl.get('category')),
});

/**
 * Item subcategory form fields.
 */
function ItemSubcategoryFormFields({ itemsCategories }) {
  const nameFieldRef = useAutofocus();

  return (
    <div className={Classes.DIALOG_BODY}>
      {/* ----------- Category ----------- */}
      <FFormGroup
        name={'category_id'}
        label={intl.get('category')}
        labelInfo={<FieldRequiredHint />}
        inline
        fastField
      >
        <FSelect
          name={'category_id'}
          items={itemsCategories}
          valueAccessor={'id'}
          textAccessor={'name'}
          placeholder={<T id={'select_category'} />}
          popoverProps={{ minimal: true, captureDismiss: true }}
        />
      </FFormGroup>

      {/* ----------- Subcategory name ----------- */}
      <FFormGroup
        name={'name'}
        label={intl.get('subcategory_name')}
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

      {/* ----------- Description ----------- */}
      <FFormGroup
        name={'description'}
        label={intl.get('description')}
        inline
        fastField
      >
        <FTextArea
          name={'description'}
          growVertically={true}
          large={true}
          fastField
        />
      </FFormGroup>
    </div>
  );
}

/**
 * Item subcategory form footer.
 */
function ItemSubcategoryFormFooterInner({
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
const ItemSubcategoryFormFooter = compose(withDialogActions)(
  ItemSubcategoryFormFooterInner,
);

/**
 * Item subcategory form dialog content.
 */
function ItemSubcategoryFormDialogContentInner({
  // #ownProps
  itemSubcategoryId,
  dialogName,
  categoryId,

  // #withDialogActions
  closeDialog,
}) {
  const isNewMode = !itemSubcategoryId;

  const { data: itemSubcategory, isFetching: isItemSubcategoryLoading } =
    useItemSubcategory(itemSubcategoryId, { enabled: !!itemSubcategoryId });

  const { data: itemsCategories, isLoading: isItemsCategoriesLoading } =
    useItemsCategories();

  const { mutateAsync: createItemSubcategoryMutate } =
    useCreateItemSubcategory();
  const { mutateAsync: editItemSubcategoryMutate } =
    useEditItemSubcategory();

  const initialValues = useMemo(() => {
    const values = {
      ...defaultInitialValues,
      ...transformToForm(
        {
          ...itemSubcategory,
          category_id: itemSubcategory?.categoryId,
        },
        defaultInitialValues,
      ),
    };
    // In new mode, pre-select the category the dialog was opened from (if any),
    // and make sure a missing value falls back to '' rather than `undefined`.
    if (!itemSubcategory && categoryId) {
      values.category_id = categoryId;
    }
    values.category_id = values.category_id ?? '';

    return values;
  }, [itemSubcategory, categoryId]);

  const transformErrors = (errors, { setErrors }) => {
    if (errors.find((error) => error.type === 'SUBCATEGORY_NAME_EXISTS')) {
      setErrors({ name: intl.get('subcategory_name_exists') });
    }
  };

  const handleFormSubmit = (values, { setSubmitting, setErrors }) => {
    setSubmitting(true);
    const form = {
      name: values.name,
      description: values.description,
      categoryId: values.category_id,
    };

    const afterSubmit = () => {
      closeDialog(dialogName);
    };
    const onSuccess = () => {
      AppToaster.show({
        message: intl.get(
          isNewMode
            ? 'the_item_subcategory_has_been_created_successfully'
            : 'the_item_subcategory_has_been_edited_successfully',
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
      createItemSubcategoryMutate(form).then(onSuccess).catch(onError);
    } else {
      editItemSubcategoryMutate([itemSubcategoryId, form])
        .then(onSuccess)
        .catch(onError);
    }
  };

  return (
    <DialogContent
      isLoading={isItemSubcategoryLoading || isItemsCategoriesLoading}
      name={'item-subcategory-form'}
    >
      <Formik
        validationSchema={SubcategoryFormSchema}
        initialValues={initialValues}
        enableReinitialize={true}
        onSubmit={handleFormSubmit}
      >
        <Form>
          <ItemSubcategoryFormFields itemsCategories={itemsCategories || []} />
          <ItemSubcategoryFormFooter isNewMode={isNewMode} dialogName={dialogName} />
        </Form>
      </Formik>
    </DialogContent>
  );
}

export const ItemSubcategoryFormDialogContent = compose(withDialogActions)(
  ItemSubcategoryFormDialogContentInner,
);
