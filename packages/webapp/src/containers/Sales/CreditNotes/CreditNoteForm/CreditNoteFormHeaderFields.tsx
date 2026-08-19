// @ts-nocheck
import React from 'react';
import styled from 'styled-components';
import { Position, FormGroup, HTMLSelect } from '@blueprintjs/core';
import { useFormikContext } from 'formik';
import { css } from '@emotion/css';
import { Theme, useTheme } from '@emotion/react';

import {
  FieldRequiredHint,
  Icon,
  FormattedMessage as T,
  CustomerDrawerLink,
  FFormGroup,
  CustomersSelect,
  Stack,
  FDateInput,
  FInputGroup,
} from '@/components';
import { customerNameFieldShouldUpdate } from './utils';

import { useCreditNoteFormContext } from './CreditNoteFormProvider';
import { CreditNoteExchangeRateInputField } from './components';
import { CreditNoteTransactionNoField } from './CreditNoteTransactionNoField';
import { useCustomerUpdateExRate } from '@/containers/Entries/withExRateItemEntriesPriceRecalc';
import { useCustomerAreas } from '@/hooks/query';
import intl from 'react-intl-universal';

const getCreditNoteFieldsStyle = (theme: Theme) => css`
  .${theme.bpPrefix}-form-group {
    margin-bottom: 0;

    &.${theme.bpPrefix}-inline {
      max-width: 450px;
    }
    .${theme.bpPrefix}-label {
      min-width: 150px;
      font-weight: 500;
    }
    .${theme.bpPrefix}-form-content {
      width: 100%;
    }
  }
`;

/**
 * Credit note form header fields.
 */
export function CreditNoteFormHeaderFields() {
  const theme = useTheme();
  const styleClassName = getCreditNoteFieldsStyle(theme);

  return (
    <Stack spacing={18} flex={1} className={styleClassName}>
      {/* ----------- Customer name ----------- */}
      <CreditNoteCustomersSelect />

      {/* ----------- Exchange rate ----------- */}
      <CreditNoteExchangeRateInputField />

      {/* ----------- Credit note date ----------- */}
      <FFormGroup
        name={'credit_note_date'}
        label={intl.get('credit_note.label_credit_note_date')}
        labelInfo={<FieldRequiredHint />}
        inline
        fastField
      >
        <FDateInput
          name={'credit_note_date'}
          formatDate={(date) => date.toLocaleDateString()}
          parseDate={(str) => new Date(str)}
          popoverProps={{ position: Position.BOTTOM_LEFT, minimal: true }}
          inputProps={{
            leftIcon: <Icon icon={'date-range'} />,
            fill: true,
          }}
          fill
          fastField
        />
      </FFormGroup>

      {/* ----------- Due date (always the credit-note date) ----------- */}
      <CreditNoteDueDateField />

      {/* ----------- Credit note # ----------- */}
      <CreditNoteTransactionNoField />

      {/* ----------- Reference ----------- */}
      <FFormGroup label={intl.get('reference_no')} name={'reference_no'} inline>
        <FInputGroup name={'reference_no'} minimal />
      </FFormGroup>
    </Stack>
  );
}

/**
 * Due date is always the credit-note date — shown so the statutory
 * sheet has the field, but not editable.
 */
function CreditNoteDueDateField() {
  const { values, setFieldValue } = useFormikContext();

  React.useEffect(() => {
    if (
      values.credit_note_date &&
      values.due_date !== values.credit_note_date
    ) {
      setFieldValue('due_date', values.credit_note_date);
    }
  }, [values.credit_note_date, values.due_date, setFieldValue]);

  return (
    <FFormGroup name={'due_date'} label={intl.get('due_date')} inline>
      <FDateInput
        name={'due_date'}
        formatDate={(date) => date.toLocaleDateString()}
        parseDate={(str) => new Date(str)}
        popoverProps={{ position: Position.BOTTOM_LEFT, minimal: true }}
        inputProps={{
          leftIcon: <Icon icon={'date-range'} />,
          fill: true,
          disabled: true,
        }}
        disabled
        fill
      />
    </FFormGroup>
  );
}

function CreditNoteFormAreaFilter({ areaId, onAreaIdChange }) {
  const { data: areas } = useCustomerAreas();

  const handleChange = (event) => {
    onAreaIdChange(event.target.value ? Number(event.target.value) : '');
  };

  return (
    <FormGroup
      label={intl.get('area') || 'Area'}
      inline={true}
      helperText={
        'Filters the customer list below -- not saved on the credit note.'
      }
    >
      <HTMLSelect fill value={areaId} onChange={handleChange}>
        <option value="">{intl.get('all_areas') || 'All areas'}</option>
        {(areas || []).map((area) => (
          <option key={area.id} value={area.id}>
            {area.name}
          </option>
        ))}
      </HTMLSelect>
    </FormGroup>
  );
}

/**
 * Customer select field of credit note form.
 * @returns {React.ReactNode}
 */
function CreditNoteCustomersSelect() {
  const { setFieldValue, values } = useFormikContext();
  const { customers } = useCreditNoteFormContext();
  const [areaId, setAreaId] = React.useState('');

  const updateEntries = useCustomerUpdateExRate();

  const filteredCustomers = React.useMemo(() => {
    if (!areaId) {
      return customers;
    }
    return customers.filter(
      (customer) => (customer.area_id ?? customer.areaId) === areaId,
    );
  }, [customers, areaId]);

  const handleItemChange = (customer) => {
    setFieldValue('customer_id', customer.id);
    setFieldValue('currency_code', customer?.currency_code);

    updateEntries(customer);
  };

  return (
    <>
      <CreditNoteFormAreaFilter areaId={areaId} onAreaIdChange={setAreaId} />
      <FFormGroup
        name={'customer_id'}
        label={intl.get('customer_name')}
        labelInfo={<FieldRequiredHint />}
        inline={true}
        fastField={true}
        shouldUpdate={customerNameFieldShouldUpdate}
        shouldUpdateDeps={{ items: filteredCustomers }}
      >
        <CustomersSelect
          name={'customer_id'}
          items={filteredCustomers}
          placeholder={<T id={'select_customer_account'} />}
          onItemChange={handleItemChange}
          popoverFill={true}
          allowCreate={true}
          fastField={true}
          shouldUpdate={customerNameFieldShouldUpdate}
          shouldUpdateDeps={{ items: filteredCustomers }}
        />
        {values.customer_id && (
          <CustomerButtonLink customerId={values.customer_id}>
            <T id={'view_customer_details'} />
          </CustomerButtonLink>
        )}
      </FFormGroup>
    </>
  );
}

const CustomerButtonLink = styled(CustomerDrawerLink)`
  font-size: 11px;
  margin-top: 6px;
`;
