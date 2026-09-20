// @ts-nocheck
import React, { useMemo } from 'react';
import classNames from 'classnames';
import styled from 'styled-components';
import {
  InputGroup,
  Position,
  Classes,
  ControlGroup,
  Button,
  HTMLSelect,
  FormGroup,
} from '@blueprintjs/core';
import { isEmpty, toSafeInteger } from 'lodash';
import { useFormikContext } from 'formik';
import { css } from '@emotion/css';
import { Theme, useTheme } from '@emotion/react';

import {
  FeatureCan,
  CustomersSelect,
  FormattedMessage as T,
  FMoneyInputGroup,
  Stack,
  FDateInput,
} from '@/components';
import { useCustomerAreas, useSalesAgents } from '@/hooks/query';
import { safeSumBy } from '@/utils';
import {
  FFormGroup,
  AccountsSelect,
  FieldRequiredHint,
  Icon,
  InputPrependText,
  CustomerDrawerLink,
  Hint,
  Money,
  FInputGroup,
} from '@/components';
import { usePaymentReceiveFormContext } from './PaymentReceiveFormProvider';
import { ACCOUNT_TYPE } from '@/constants/accountTypes';
import { ProjectsSelect } from '@/containers/Projects/components';
import {
  PaymentReceiveExchangeRateInputField,
  PaymentReceiveProjectSelectButton,
} from './components';

import {
  amountPaymentEntries,
  fullAmountPaymentEntries,
  customersFieldShouldUpdate,
  accountsFieldShouldUpdate,
} from './utils';
import { Features } from '@/constants';
import { PaymentReceivePaymentNoField } from './PaymentReceivePaymentNoField';
import intl from 'react-intl-universal';

const getHeaderFieldsStyle = (theme: Theme) => css`
  .${theme.bpPrefix}-form-group {
    margin-bottom: 0;

    &.${theme.bpPrefix}-inline {
      max-width: 470px;
    }
    .${theme.bpPrefix}-label {
      min-width: 160px;
    }
    .${theme.bpPrefix}-form-content {
      width: 100%;
    }
  }
`;

/**
 * Payment receive header fields.
 */
export function PaymentReceiveHeaderFields() {
  const theme = useTheme();
  const styleClassName = getHeaderFieldsStyle(theme);

  // Payment receive form context.
  const { accounts, projects } = usePaymentReceiveFormContext();

  // Formik form context.
  // Formik form context.
  const {
    values: { entries, currency_code, amount, payment_method },
    setFieldValue,
  } = useFormikContext();

  // Calculates the full-amount received.
  const totalDueAmount = useMemo(
    () => safeSumBy(entries, 'due_amount'),
    [entries],
  );
  const assignedAmount = useMemo(
    () => safeSumBy(entries, 'payment_amount'),
    [entries],
  );
  const remainingToAssign = (Number(amount) || 0) - assignedAmount;
  const isCash = payment_method === 'cash';
  const isBank =
    payment_method === 'bank_transfer' || payment_method === 'bank_deposit';
  // Handle receive full-amount link click.
  const handleReceiveFullAmountClick = () => {
    const newEntries = fullAmountPaymentEntries(entries);
    const fullAmount = safeSumBy(newEntries, 'payment_amount');

    setFieldValue('entries', newEntries);
    setFieldValue('amount', fullAmount);
  };
  // Handles the full-amount field blur.
  const onFullAmountBlur = (value) => {
    const newEntries = amountPaymentEntries(toSafeInteger(value), entries);
    setFieldValue('entries', newEntries);
  };

  return (
    <Stack spacing={18} flex={1} className={styleClassName}>
      {/* ------------- Customer name ------------- */}
      <PaymentReceiveCustomerSelect />

      {/* ------------- Payment method ------------- */}
      <PaymentReceiveMethodFields />

      {/* ----------- Exchange rate ----------- */}
      <PaymentReceiveExchangeRateInputField
        name={'exchange_rate'}
        formGroupProps={{ label: ' ', inline: true }}
      />

      {/* ------------- Payment date ------------- */}
      <FFormGroup
        name={'payment_date'}
        label={intl.get('payment_date')}
        labelInfo={<FieldRequiredHint />}
        inline
        fastField
      >
        <FDateInput
          name={'payment_date'}
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

      {/* ------------ Full amount ------------ */}
      <FFormGroup
        name={'amount'}
        label={intl.get('full_amount')}
        inline={true}
        labelInfo={<Hint />}
        fastField
      >
        <ControlGroup>
          <InputPrependText text={currency_code} />
          <FMoneyInputGroup
            name={'amount'}
            onBlurValue={onFullAmountBlur}
            fastField
          />
        </ControlGroup>

        {!isEmpty(entries) && (
          <Button
            onClick={handleReceiveFullAmountClick}
            className={css`
              &:not([class*='${theme.bpPrefix}-intent-']) {
                &.${theme.bpPrefix}-minimal {
                  width: auto;
                  padding: 0;
                  min-height: auto;
                  font-size: 12px;
                  margin-top: 4px;
                  background-color: transparent;
                  color: #0052cc;

                  &:hover {
                    text-decoration: underline;
                  }
                }
              }
            `}
            small
            minimal
          >
            <T id={'receive_full_amount'} /> (
            <Money amount={totalDueAmount} currency={currency_code} />)
          </Button>
        )}
        <div style={{ marginTop: 6, fontSize: 12 }}>
          {intl.get('remaining_to_assign')}:{' '}
          <Money amount={remainingToAssign} currency={currency_code} />
        </div>
      </FFormGroup>

      {/* ------------ Payment receive no. ------------ */}
      <PaymentReceivePaymentNoField />

      {/* ------------ Deposit account (bank methods only) ------------ */}
      {isBank && (
      <FFormGroup
        name={'deposit_account_id'}
        label={intl.get('deposit_to')}
        inline={true}
        labelInfo={<FieldRequiredHint />}
        items={accounts}
        shouldUpdate={accountsFieldShouldUpdate}
        fastField={true}
      >
        <AccountsSelect
          name={'deposit_account_id'}
          items={accounts}
          labelInfo={<FieldRequiredHint />}
          placeholder={<T id={'select_deposit_account'} />}
          filterByTypes={[ACCOUNT_TYPE.BANK]}
          shouldUpdate={accountsFieldShouldUpdate}
          fastField={true}
          fill={true}
        />
      </FFormGroup>
      )}

      {/* ------------ Reference No. ------------ */}
      <FFormGroup
        name={'reference_no'}
        label={intl.get('reference')}
        inline
        fastField
      >
        <InputGroup name={'reference_no'} minimal fastField />
      </FFormGroup>

      {/*------------ Project name -----------*/}
      <FeatureCan feature={Features.Projects}>
        <FFormGroup
          name={'project_id'}
          label={intl.get('payment_receive.project_name.label')}
          inline={true}
          className={classNames('form-group--select-list', Classes.FILL)}
        >
          <ProjectsSelect
            name={'project_id'}
            projects={projects}
            input={PaymentReceiveProjectSelectButton}
            popoverFill={true}
          />
        </FFormGroup>
      </FeatureCan>
    </Stack>
  );
}

const CustomerButtonLink = styled(CustomerDrawerLink)`
  font-size: 11px;
  margin-top: 6px;
`;

function PaymentReceiveMethodFields() {
  const { values, setFieldValue } = useFormikContext();
  const { data: agents } = useSalesAgents();
  const { isNewMode } = usePaymentReceiveFormContext();

  const handleMethodChange = (event) => {
    const method = event.target.value;
    setFieldValue('payment_method', method);
    setFieldValue('agent_id', '');
    if (method === 'cash') {
      setFieldValue('deposit_account_id', '');
    }
  };

  const handleAgentChange = (event) => {
    const agentId = event.target.value ? Number(event.target.value) : '';
    setFieldValue('agent_id', agentId);
    const agent = (agents || []).find((item) => item.id === agentId);
    if (agent?.cashAccountId) {
      setFieldValue('deposit_account_id', agent.cashAccountId);
    }
  };

  return (
    <>
      <FFormGroup
        name={'payment_method'}
        label={intl.get('payment_method')}
        labelInfo={<FieldRequiredHint />}
        inline
      >
        <HTMLSelect
          fill
          value={values.payment_method || ''}
          disabled={!isNewMode}
          onChange={handleMethodChange}
        >
          <option value="">{intl.get('select_payment_method')}</option>
          <option value="cash">{intl.get('payment_method.cash')}</option>
          <option value="bank_transfer">
            {intl.get('payment_method.bank_transfer')}
          </option>
          <option value="bank_deposit">
            {intl.get('payment_method.bank_deposit')}
          </option>
          <option value="pd_cheque">{intl.get('payment_method.pd_cheque')}</option>
        </HTMLSelect>
      </FFormGroup>

      {values.payment_method === 'pd_cheque' && (
        <>
          <FFormGroup
            name={'cheque_no'}
            label={intl.get('cheque_number')}
            labelInfo={<FieldRequiredHint />}
            inline
          >
            <FInputGroup name={'cheque_no'} fill />
          </FFormGroup>
          <FFormGroup
            name={'banking_date'}
            label={intl.get('banking_date')}
            labelInfo={<FieldRequiredHint />}
            inline
          >
            <FDateInput
              name={'banking_date'}
              formatDate={(date) => date.toLocaleDateString()}
              parseDate={(str) => new Date(str)}
              popoverProps={{ position: Position.BOTTOM_LEFT, minimal: true }}
              fill
            />
          </FFormGroup>
        </>
      )}

      {values.payment_method === 'cash' && (
        <FFormGroup
          name={'agent_id'}
          label={intl.get('agent')}
          labelInfo={<FieldRequiredHint />}
          inline
        >
          <HTMLSelect
            fill
            value={values.agent_id || ''}
            disabled={!isNewMode}
            onChange={handleAgentChange}
          >
            <option value="">{intl.get('select_agent')}</option>
            {(agents || [])
              .filter((agent) => agent.active !== false)
              .map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
          </HTMLSelect>
        </FFormGroup>
      )}
    </>
  );
}

/**
 * Customer select field of payment receive form.
 */
function PaymentReceiveCustomerSelect() {
  const { customers, isNewMode } = usePaymentReceiveFormContext();
  const { values, setFieldValue } = useFormikContext();
  const { data: areas } = useCustomerAreas();
  const areaId = values.area_id || '';

  const filteredCustomers = React.useMemo(() => {
    if (!areaId) {
      return [];
    }
    return customers.filter(
      (customer) => (customer.area_id ?? customer.areaId) === Number(areaId),
    );
  }, [customers, areaId]);

  return (
    <>
      <FormGroup
        label={intl.get('area')}
        inline={true}
        helperText={intl.get('select_area_first')}
      >
        <HTMLSelect
          fill
          value={areaId}
          onChange={(event) => {
            setFieldValue('area_id', event.target.value);
            setFieldValue('customer_id', '');
          }}
        >
          <option value="">{intl.get('select_area_first')}</option>
          {(areas || []).map((area) => (
            <option key={area.id} value={area.id}>
              {area.name}
            </option>
          ))}
        </HTMLSelect>
      </FormGroup>

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
          onItemChange={(customer) => {
            setFieldValue('customer_id', customer.id);
            setFieldValue('full_amount', '');
            setFieldValue('currency_code', customer?.currency_code);
          }}
          popoverFill={true}
          disabled={!isNewMode}
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
