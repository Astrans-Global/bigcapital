// @ts-nocheck
import React from 'react';
import styled from 'styled-components';
import classNames from 'classnames';
import { useFormikContext } from 'formik';
import { Position, Classes, FormGroup, HTMLSelect } from '@blueprintjs/core';
import { css } from '@emotion/css';
import { Theme, useTheme } from '@emotion/react';

import { ACCOUNT_TYPE } from '@/constants/accountTypes';
import { Features } from '@/constants';
import {
  FFormGroup,
  AccountsSelect,
  CustomersSelect,
  FieldRequiredHint,
  Icon,
  CustomerDrawerLink,
  FormattedMessage as T,
  FeatureCan,
  FInputGroup,
  Stack,
  FDateInput,
} from '@/components';
import { ProjectsSelect } from '@/containers/Projects/components';
import { useReceiptFormContext } from './ReceiptFormProvider';
import { accountsFieldShouldUpdate, customersFieldShouldUpdate } from './utils';
import {
  ReceiptExchangeRateInputField,
  ReceiptProjectSelectButton,
} from './components';
import { ReceiptFormReceiptNumberField } from './ReceiptFormReceiptNumberField';
import { useCustomerUpdateExRate } from '@/containers/Entries/withExRateItemEntriesPriceRecalc';
import { useCustomerAreas } from '@/hooks/query';
import intl from 'react-intl-universal';

const getEstimateFieldsStyle = (theme: Theme) => css`
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
 * Receipt form header fields.
 */
export function ReceiptFormHeader() {
  const theme = useTheme();
  const receiptFieldsClassName = getEstimateFieldsStyle(theme);
  const { accounts, projects } = useReceiptFormContext();

  return (
    <Stack spacing={18} flex={1} className={receiptFieldsClassName}>
      {/* ----------- Customer name ----------- */}
      <ReceiptFormCustomerSelect />

      {/* ----------- Exchange rate ----------- */}
      <ReceiptExchangeRateInputField />

      {/* ----------- Deposit account ----------- */}
      <FFormGroup
        label={intl.get('deposit_account')}
        inline={true}
        labelInfo={<FieldRequiredHint />}
        name={'deposit_account_id'}
        items={accounts}
        fastField={true}
        shouldUpdate={accountsFieldShouldUpdate}
      >
        <AccountsSelect
          items={accounts}
          name={'deposit_account_id'}
          placeholder={<T id={'select_deposit_account'} />}
          filterByTypes={[
            ACCOUNT_TYPE.CASH,
            ACCOUNT_TYPE.BANK,
            ACCOUNT_TYPE.OTHER_CURRENT_ASSET,
          ]}
          allowCreate={true}
          fill={true}
          fastField={true}
          shouldUpdate={accountsFieldShouldUpdate}
        />
      </FFormGroup>

      {/* ----------- Receipt date ----------- */}
      <FFormGroup
        name={'receipt_date'}
        label={intl.get('receipt_date')}
        inline
        fastField
      >
        <FDateInput
          name={'receipt_date'}
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

      {/* ----------- Due date (always the receipt date — cash sale) ----------- */}
      <ReceiptDueDateField />

      {/* ----------- Receipt number ----------- */}
      <ReceiptFormReceiptNumberField />

      {/* ----------- Reference ----------- */}
      <FFormGroup
        label={intl.get('reference')}
        inline={true}
        name={'reference_no'}
      >
        <FInputGroup minimal={true} name={'reference_no'} />
      </FFormGroup>

      {/*------------ Project name -----------*/}
      <FeatureCan feature={Features.Projects}>
        <FFormGroup
          name={'project_id'}
          label={intl.get('receipt.project_name.label')}
          inline={true}
          className={classNames('form-group--select-list', Classes.FILL)}
        >
          <ProjectsSelect
            name={'project_id'}
            projects={projects}
            input={ReceiptProjectSelectButton}
            popoverFill={true}
          />
        </FFormGroup>
      </FeatureCan>
    </Stack>
  );
}

/**
 * Due date is always the receipt date on a cash sale — shown so the
 * statutory invoice has the field, but not editable.
 */
function ReceiptDueDateField() {
  const { values, setFieldValue } = useFormikContext();

  React.useEffect(() => {
    if (values.receipt_date && values.due_date !== values.receipt_date) {
      setFieldValue('due_date', values.receipt_date);
    }
  }, [values.receipt_date, values.due_date, setFieldValue]);

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

function ReceiptFormAreaFilter({ areaId, onAreaIdChange }) {
  const { data: areas } = useCustomerAreas();

  const handleChange = (event) => {
    onAreaIdChange(event.target.value ? Number(event.target.value) : '');
  };

  return (
    <FormGroup
      label={intl.get('area') || 'Area'}
      inline={true}
      helperText={'Filters the customer list below -- not saved on the receipt.'}
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
 * Customer select field of receipt form.
 * @returns {React.ReactNode}
 */
function ReceiptFormCustomerSelect() {
  const { setFieldValue, values } = useFormikContext();
  const { customers } = useReceiptFormContext();
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
      <ReceiptFormAreaFilter areaId={areaId} onAreaIdChange={setAreaId} />
      <FFormGroup
        name={'customer_id'}
        label={intl.get('customer_name')}
        labelInfo={<FieldRequiredHint />}
        inline={true}
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
