// @ts-nocheck
import React from 'react';
import styled from 'styled-components';
import { Position, FormGroup, HTMLSelect } from '@blueprintjs/core';
import { useFormikContext } from 'formik';
import { css } from '@emotion/css';
import { Theme, useTheme } from '@emotion/react';
import {
  FFormGroup,
  FormattedMessage as T,
  FieldRequiredHint,
  Icon,
  CustomerDrawerLink,
  CustomersSelect,
  FInputGroup,
  Stack,
  FDateInput,
} from '@/components';
import { customersFieldShouldUpdate } from './utils';
import { EstimateExchangeRateInputField } from './components';
import { EstimateFormEstimateNumberField } from './EstimateFormEstimateNumberField';
import { useEstimateFormContext } from './EstimateFormProvider';
import { useCustomerUpdateExRate } from '@/containers/Entries/withExRateItemEntriesPriceRecalc';
import { useCustomerAreas } from '@/hooks/query';
import intl from 'react-intl-universal';

const getEstimateFieldsStyle = (theme: Theme) => css`
  .${theme.bpPrefix}-form-group {
    margin-bottom: 0;

    &.${theme.bpPrefix}-inline {
      max-width: 470px;
    }
    .${theme.bpPrefix}-label {
      min-width: 160px;
      font-weight: 500;
    }
    .${theme.bpPrefix}-form-content {
      width: 100%;
    }
  }
`;

/**
 * Estimate form header fields — same overlay as the invoice window, with
 * due date locked to the estimate date. See docs/ops/PHASE1.md ("Estimates").
 */
export function EstimateFormHeader() {
  const theme = useTheme();
  const styleClassName = getEstimateFieldsStyle(theme);

  return (
    <Stack spacing={18} flex={1} className={styleClassName}>
      <EstimateFormCustomerSelect />
      <EstimateExchangeRateInputField />

      <FFormGroup
        name={'estimate_date'}
        label={intl.get('estimate_date')}
        labelInfo={<FieldRequiredHint />}
        inline
        fastField
      >
        <FDateInput
          name={'estimate_date'}
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

      <EstimateDueDateField />
      <EstimateFormEstimateNumberField />

      <FFormGroup name={'reference'} label={intl.get('reference')} inline fill>
        <FInputGroup name={'reference'} minimal={true} />
      </FFormGroup>
    </Stack>
  );
}

function EstimateDueDateField() {
  const { values, setFieldValue } = useFormikContext();

  React.useEffect(() => {
    if (
      values.estimate_date &&
      values.expiration_date !== values.estimate_date
    ) {
      setFieldValue('expiration_date', values.estimate_date);
    }
  }, [values.estimate_date, values.expiration_date, setFieldValue]);

  return (
    <FFormGroup name={'expiration_date'} label={intl.get('due_date')} inline>
      <FDateInput
        name={'expiration_date'}
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

function EstimateFormAreaFilter({ areaId, onAreaIdChange }) {
  const { data: areas } = useCustomerAreas();

  const handleChange = (event) => {
    onAreaIdChange(event.target.value ? Number(event.target.value) : '');
  };

  return (
    <FormGroup
      label={intl.get('area') || 'Area'}
      inline={true}
      helperText={'Filters the customer list below -- not saved on the estimate.'}
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

function EstimateFormCustomerSelect() {
  const { setFieldValue, values } = useFormikContext();
  const { customers } = useEstimateFormContext();
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
      <EstimateFormAreaFilter areaId={areaId} onAreaIdChange={setAreaId} />
      <FFormGroup
        label={intl.get('customer_name')}
        inline={true}
        labelInfo={<FieldRequiredHint />}
        name={'customer_id'}
        fastField={true}
        shouldUpdate={customersFieldShouldUpdate}
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
          shouldUpdate={customersFieldShouldUpdate}
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
