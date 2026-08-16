// @ts-nocheck
import React from 'react';
import { Box } from '@/components';
import {
  FormattedMessage as T,
  FFormGroup,
  FInputGroup,
  FTextArea,
} from '@/components';
import { CustomerFormSectionTitle } from './CustomerFormSectionTitle';
import intl from 'react-intl-universal';

export function CustomerBillingAddress() {
  return (
    <Box data-section-id="billingAddress">
      <CustomerFormSectionTitle>
        <T id={'billing_address'} />
      </CustomerFormSectionTitle>
      <FFormGroup
        name={'billing_address_country'}
        label={intl.get('country')}
        inline
        fill
      >
        <FInputGroup name={'billing_address_country'} fill />
      </FFormGroup>

      <FFormGroup
        name={'billing_address1'}
        label={intl.get('address_line_1')}
        inline
        fill
      >
        <FTextArea name={'billing_address1'} fill />
      </FFormGroup>

      <FFormGroup
        name={'billing_address2'}
        label={intl.get('address_line_2')}
        inline
        fill
      >
        <FTextArea name={'billing_address2'} fill />
      </FFormGroup>

      <FFormGroup
        name={'billing_address3'}
        label={intl.get('address_line_3')}
        inline
        fill
      >
        <FTextArea name={'billing_address3'} fill />
      </FFormGroup>

      <FFormGroup
        name={'billing_address_city'}
        label={intl.get('city_town')}
        inline
        fill
      >
        <FInputGroup name={'billing_address_city'} fill />
      </FFormGroup>

      <FFormGroup
        name={'billing_address_state'}
        label={intl.get('state')}
        inline
        fill
      >
        <FInputGroup name={'billing_address_state'} fill />
      </FFormGroup>

      <FFormGroup
        name={'billing_address_postcode'}
        label={intl.get('zip_code')}
        inline
        fill
      >
        <FInputGroup name={'billing_address_postcode'} fill />
      </FFormGroup>
    </Box>
  );
}
