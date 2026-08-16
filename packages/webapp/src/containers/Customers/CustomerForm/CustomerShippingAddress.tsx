// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Checkbox } from '@blueprintjs/core';
import { useFormikContext } from 'formik';
import { Box } from '@/components';
import {
  FormattedMessage as T,
  FFormGroup,
  FInputGroup,
  FTextArea,
} from '@/components';
import { CustomerFormSectionTitle } from './CustomerFormSectionTitle';
import intl from 'react-intl-universal';

const BILLING_TO_SHIPPING_FIELDS = [
  ['billing_address_country', 'shipping_address_country'],
  ['billing_address1', 'shipping_address1'],
  ['billing_address2', 'shipping_address2'],
  ['billing_address3', 'shipping_address3'],
  ['billing_address_city', 'shipping_address_city'],
  ['billing_address_state', 'shipping_address_state'],
  ['billing_address_postcode', 'shipping_address_postcode'],
];

export function CustomerShippingAddress() {
  const { values, setFieldValue } = useFormikContext();
  const [sameAsBilling, setSameAsBilling] = useState(false);

  // Keeps the shipping address mirrored to the billing address for as long
  // as the "same as billing address" checkbox stays ticked.
  useEffect(() => {
    if (!sameAsBilling) return;

    BILLING_TO_SHIPPING_FIELDS.forEach(([billingField, shippingField]) => {
      setFieldValue(shippingField, values[billingField]);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    sameAsBilling,
    ...BILLING_TO_SHIPPING_FIELDS.map(([billingField]) => values[billingField]),
  ]);

  return (
    <Box data-section-id="shippingAddress">
      <CustomerFormSectionTitle>
        <T id={'shipping_address'} />
      </CustomerFormSectionTitle>

      <Checkbox
        checked={sameAsBilling}
        label={intl.get('same_as_billing_address')}
        onChange={(event) => setSameAsBilling(event.currentTarget.checked)}
        style={{ marginBottom: 15 }}
      />

      <FFormGroup
        name={'shipping_address_country'}
        label={intl.get('country')}
        inline
        fill
      >
        <FInputGroup
          name={'shipping_address_country'}
          disabled={sameAsBilling}
          fill
        />
      </FFormGroup>

      <FFormGroup
        name={'shipping_address1'}
        label={intl.get('address_line_1')}
        inline
        fill
      >
        <FTextArea
          name={'shipping_address1'}
          disabled={sameAsBilling}
          fill
        />
      </FFormGroup>

      <FFormGroup
        name={'shipping_address2'}
        label={intl.get('address_line_2')}
        inline
        fill
      >
        <FTextArea
          name={'shipping_address2'}
          disabled={sameAsBilling}
          fill
        />
      </FFormGroup>

      <FFormGroup
        name={'shipping_address3'}
        label={intl.get('address_line_3')}
        inline
        fill
      >
        <FTextArea
          name={'shipping_address3'}
          disabled={sameAsBilling}
          fill
        />
      </FFormGroup>

      <FFormGroup
        name={'shipping_address_city'}
        label={intl.get('city_town')}
        inline
        fill
      >
        <FInputGroup
          name={'shipping_address_city'}
          disabled={sameAsBilling}
          fill
        />
      </FFormGroup>

      <FFormGroup
        name={'shipping_address_state'}
        label={intl.get('state')}
        inline
        fill
      >
        <FInputGroup
          name={'shipping_address_state'}
          disabled={sameAsBilling}
          fill
        />
      </FFormGroup>

      <FFormGroup
        name={'shipping_address_postcode'}
        label={intl.get('zip_code')}
        inline
        fill
      >
        <FInputGroup
          name={'shipping_address_postcode'}
          disabled={sameAsBilling}
          fill
        />
      </FFormGroup>
    </Box>
  );
}
