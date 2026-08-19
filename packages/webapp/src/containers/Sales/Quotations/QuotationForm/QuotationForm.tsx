// @ts-nocheck
import intl from 'react-intl-universal';
import { css } from '@emotion/css';
import { Formik, Form } from 'formik';
import { Intent } from '@blueprintjs/core';
import { sumBy, isEmpty } from 'lodash';
import { useHistory } from 'react-router-dom';
import { AppToaster } from '@/components';
import { PageForm } from '@/components/PageForm';
import { useCurrentOrganizationBaseCurrency } from '@/hooks/query';
import { orderingLinesIndexes } from '@/utils';
import { useQuotationFormContext } from './QuotationFormProvider';
import { QuotationFormHeader } from './QuotationFormHeader';
import { QuotationItemsEntriesEditorField } from './QuotationItemsEntriesEditorField';
import { QuotationFormFooter } from './QuotationFormFooter';
import { QuotationFloatingActions } from './QuotationFloatingActions';
import { QuotationFormTopBar } from './QuotationFormTopBar';
import { QuotationFormSchema } from './QuotationForm.schema';
import {
  transformToEditForm,
  defaultQuotation,
  transformFormValuesToRequest,
  MAX_QUOTATION_LINES,
} from './utils';

export function QuotationForm() {
  const baseCurrency = useCurrentOrganizationBaseCurrency();
  const history = useHistory();
  const {
    quotation,
    isNewMode,
    submitPayload,
    createQuotationMutate,
    editQuotationMutate,
  } = useQuotationFormContext();

  const initialValues = !isEmpty(quotation)
    ? transformToEditForm(quotation)
    : {
        ...defaultQuotation,
        entries: orderingLinesIndexes(defaultQuotation.entries),
        currency_code: baseCurrency,
      };

  const handleSubmit = (values, { setSubmitting }) => {
    const entries = values.entries.filter(
      (item) => item.item_id && item.quantity,
    );
    if (entries.length > MAX_QUOTATION_LINES) {
      AppToaster.show({
        message: `A quotation can have at most ${MAX_QUOTATION_LINES} item lines.`,
        intent: Intent.DANGER,
      });
      setSubmitting(false);
      return;
    }
    if (sumBy(entries, (entry) => parseInt(entry.quantity, 10) || 0) === 0) {
      AppToaster.show({
        message: intl.get('quantity_cannot_be_zero_or_empty'),
        intent: Intent.DANGER,
      });
      setSubmitting(false);
      return;
    }

    const form = transformFormValuesToRequest(values);
    const onSuccess = () => {
      AppToaster.show({
        message: 'The quotation has been saved.',
        intent: Intent.SUCCESS,
      });
      setSubmitting(false);
      if (submitPayload.redirect) {
        history.push('/quotations');
      }
    };
    const onError = () => {
      AppToaster.show({
        message: 'Could not save this quotation.',
        intent: Intent.DANGER,
      });
      setSubmitting(false);
    };

    if (!isNewMode) {
      editQuotationMutate([quotation.id, form]).then(onSuccess).catch(onError);
    } else {
      createQuotationMutate(form).then(onSuccess).catch(onError);
    }
  };

  return (
    <Formik
      validationSchema={QuotationFormSchema}
      initialValues={initialValues}
      onSubmit={handleSubmit}
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
          <PageForm.Body>
            <QuotationFormTopBar />
            <QuotationFormHeader />
            <QuotationItemsEntriesEditorField />
            <QuotationFormFooter />
          </PageForm.Body>
          <PageForm.Footer>
            <QuotationFloatingActions />
          </PageForm.Footer>
        </PageForm>
      </Form>
    </Formik>
  );
}
