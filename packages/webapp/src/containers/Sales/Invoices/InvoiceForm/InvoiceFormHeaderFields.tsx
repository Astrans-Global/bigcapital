// @ts-nocheck
import React from 'react';
import styled from 'styled-components';
import classNames from 'classnames';
import { Position, Classes, FormGroup, HTMLSelect } from '@blueprintjs/core';
import { useFormikContext } from 'formik';
import { css } from '@emotion/css';
import { Theme, useTheme } from '@emotion/react';

import {
  FFormGroup,
  FormattedMessage as T,
  CustomerDrawerLink,
  FieldRequiredHint,
  FeatureCan,
  CustomersSelect,
  Stack,
  FInputGroup,
  Icon,
  FDateInput,
} from '@/components';
import { customerNameFieldShouldUpdate } from './utils';

import { useInvoiceFormContext } from './InvoiceFormProvider';
import { useCustomerUpdateExRate } from '@/containers/Entries/withExRateItemEntriesPriceRecalc';
import { useCustomerAreas } from '@/hooks/query';
import {
  InvoiceExchangeRateInputField,
  InvoiceProjectSelectButton,
} from './components';
import { InvoiceFormInvoiceNumberField } from './InvoiceFormInvoiceNumberField';
import {
  ProjectsSelect,
  ProjectBillableEntriesLink,
} from '@/containers/Projects/components';
import { Features } from '@/constants';
import intl from 'react-intl-universal';

const getInvoiceFieldsStyle = (theme: Theme) => css`
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
 * Invoice form header fields.
 */
export function InvoiceFormHeaderFields() {
  const theme = useTheme();
  const { projects } = useInvoiceFormContext();
  const { values } = useFormikContext();
  const invoiceFieldsClassName = getInvoiceFieldsStyle(theme);

  return (
    <Stack spacing={18} flex={1} className={invoiceFieldsClassName}>
      {/* ----------- Customer name ----------- */}
      <InvoiceFormCustomerSelect />

      {/* ----------- Exchange rate ----------- */}
      <InvoiceExchangeRateInputField />

      {/* ----------- Invoice date ----------- */}
      <FFormGroup
        name={'invoice_date'}
        label={intl.get('invoice_date')}
        labelInfo={<FieldRequiredHint />}
        inline
        fastField
      >
        <FDateInput
          name={'invoice_date'}
          formatDate={(date) => date.toLocaleDateString()}
          parseDate={(str) => new Date(str)}
          popoverProps={{
            position: Position.BOTTOM_LEFT,
            minimal: true,
            fill: true,
          }}
          inputProps={{
            leftIcon: <Icon icon={'date-range'} />,
          }}
          fill
          fastField
        />
      </FFormGroup>

      {/* ----------- Due date ----------- */}
      <FFormGroup
        name={'due_date'}
        label={intl.get('due_date')}
        labelInfo={<FieldRequiredHint />}
        inline
        fastField
      >
        <FDateInput
          name={'due_date'}
          formatDate={(date) => date.toLocaleDateString()}
          parseDate={(str) => new Date(str)}
          popoverProps={{
            position: Position.BOTTOM_LEFT,
            minimal: true,
            fill: true,
          }}
          inputProps={{
            leftIcon: <Icon icon={'date-range'} />,
            fill: true,
          }}
          fill
          fastField
        />
      </FFormGroup>

      {/* ----------- Invoice number ----------- */}
      <InvoiceFormInvoiceNumberField />

      {/* ----------- Reference ----------- */}
      <FFormGroup name={'reference_no'} label={intl.get('reference')} inline>
        <FInputGroup name={'reference_no'} minimal={true} />
      </FFormGroup>

      {/*------------ Project name -----------*/}
      <FeatureCan feature={Features.Projects}>
        <FFormGroup
          name={'project_id'}
          label={intl.get('invoice.project_name.label')}
          inline={true}
          className={classNames('form-group--select-list', Classes.FILL)}
        >
          <ProjectsSelect
            name={'project_id'}
            projects={projects}
            input={InvoiceProjectSelectButton}
            popoverFill={true}
          />
          {values?.project_id && (
            <ProjectBillableEntriesLink projectId={values?.project_id}>
              <T id={'add_billable_entries'} />
            </ProjectBillableEntriesLink>
          )}
        </FFormGroup>
      </FeatureCan>
    </Stack>
  );
}

/**
 * Area filter for the customer select below -- this is a webapp-only
 * convenience, it narrows down the customer list to a single area so it's
 * quicker to find the right customer on a long list. It is NOT saved on the
 * invoice itself -- the invoice's area is always resolved from whichever
 * customer ends up selected (see docs/ops/PHASE1.md, "Areas & Route
 * Cities").
 */
function InvoiceFormAreaFilter({ areaId, onAreaIdChange }) {
  const { data: areas } = useCustomerAreas();

  const handleChange = (event) => {
    onAreaIdChange(event.target.value ? Number(event.target.value) : '');
  };

  return (
    <FormGroup
      label={intl.get('area') || 'Area'}
      inline={true}
      helperText={
        intl.get('invoice.area_filter.hint') ||
        'Filters the customer list below -- not saved on the invoice.'
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
 * Customer select field of the invoice form.
 * @returns {React.ReactNode}
 */
function InvoiceFormCustomerSelect() {
  const { values, setFieldValue } = useFormikContext();
  const { customers } = useInvoiceFormContext();
  const [areaId, setAreaId] = React.useState('');

  const updateEntries = useCustomerUpdateExRate();

  const filteredCustomers = React.useMemo(() => {
    if (!areaId) {
      return customers;
    }
    // `useCustomers` (InvoiceFormProvider) fetches without camelCase
    // transform, so the raw customer records are snake_case here --
    // `area_id`, not `areaId`. Check both just in case that ever changes.
    return customers.filter(
      (customer) => (customer.area_id ?? customer.areaId) === areaId,
    );
  }, [customers, areaId]);

  // Handles the customer item change.
  const handleItemChange = (customer) => {
    // If the customer id has changed change the customer id and currency code.
    if (values.customer_id !== customer.id) {
      setFieldValue('customer_id', customer.id);
      setFieldValue('currency_code', customer?.currency_code);
    }
    updateEntries(customer);
  };

  return (
    <>
      <InvoiceFormAreaFilter areaId={areaId} onAreaIdChange={setAreaId} />

      <FFormGroup
        name={'customer_id'}
        label={intl.get('customer_name')}
        inline={true}
        labelInfo={<FieldRequiredHint />}
        fastField={true}
        shouldUpdate={customerNameFieldShouldUpdate}
        shouldUpdateDeps={{ items: filteredCustomers }}
      >
        <CustomersSelect
          name={'customer_id'}
          items={filteredCustomers}
          placeholder={<T id={'select_customer_account'} />}
          onItemChange={handleItemChange}
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
