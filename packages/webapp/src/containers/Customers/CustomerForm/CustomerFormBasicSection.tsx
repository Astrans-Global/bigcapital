// @ts-nocheck
import React from 'react';
import intl from 'react-intl-universal';
import { useFormikContext } from 'formik';
import {
  ControlGroup,
  Divider,
  Icon as BlueprintIcon,
} from '@blueprintjs/core';
import {
  Hint,
  FieldRequiredHint,
  SalutationList,
  DisplayNameList,
  FInputGroup,
  FFormGroup,
  Box,
  Icon,
  Stack,
  CustomerAreaSelect,
  CustomerRouteCitySelect,
} from '@/components';
import { CustomerTypeRadioField } from './CustomerTypeRadioField';
import { CustomerFormSectionTitle } from './CustomerFormSectionTitle';
import { useAutofocus } from '@/hooks';
import { useCustomerAreas, useCustomerRouteCities } from '@/hooks/query';

export function CustomerFormBasicSection({}) {
  const firstNameFieldRef = useAutofocus();
  const { values, setFieldValue } = useFormikContext();

  const { data: customerAreas } = useCustomerAreas();
  const { data: customerRouteCities } = useCustomerRouteCities({
    areaId: values.area_id || undefined,
  });

  return (
    <Box data-section-id="primary">
      <CustomerFormSectionTitle>Customer details</CustomerFormSectionTitle>

      {/**-----------Customer type. -----------*/}
      <CustomerTypeRadioField />

      {/**----------- Contact name -----------*/}
      <FFormGroup
        name={'salutation'}
        label={intl.get('contact_name')}
        inline
        fill
      >
        <ControlGroup fill>
          <SalutationList
            name={'salutation'}
            popoverProps={{ minimal: true }}
          />
          <FInputGroup
            name={'first_name'}
            placeholder={intl.get('first_name')}
            inputRef={(ref) => (firstNameFieldRef.current = ref)}
            fill
          />
          <FInputGroup
            name={'last_name'}
            placeholder={intl.get('last_name')}
            fill
          />
        </ControlGroup>
      </FFormGroup>

      <FFormGroup
        name={'code'}
        label={'Customer Code'}
        helperText="Add a unique account number to identify, reference and search for the contact."
        inline
        fill
      >
        <FInputGroup name={'code'} fill />
      </FFormGroup>

      {/*----------- Company Name -----------*/}
      <FFormGroup
        name={'company_name'}
        label={intl.get('company_name')}
        inline
        fill
      >
        <FInputGroup name={'company_name'} fill />
      </FFormGroup>

      {/*----------- Display Name (Call Name) -----------*/}
      <FFormGroup
        name={'display_name'}
        label={intl.get('call_name')}
        helperText="This is the name that appears on invoices and emails."
        inline
        fill
      >
        <DisplayNameList
          name={'display_name'}
          popoverProps={{ minimal: true }}
          buttonProps={{ fill: true }}
        />
      </FFormGroup>

      {/*----------- Contact person -----------*/}
      <FFormGroup
        name={'contact_person'}
        label={intl.get('contact_person')}
        inline
        fill
      >
        <FInputGroup name={'contact_person'} fill />
      </FFormGroup>

      <Divider style={{ margin: '20px 0' }} />

      {/*----------- Area -----------*/}
      <FFormGroup
        name={'area_id'}
        label={intl.get('area')}
        labelInfo={<FieldRequiredHint />}
        inline
        fill
      >
        <CustomerAreaSelect
          name={'area_id'}
          items={customerAreas || []}
          fill
          buttonProps={{ fill: true }}
          onItemSelect={(area) => {
            setFieldValue('area_id', area.id);
            // Route city belongs to an area, reset it whenever the area changes.
            setFieldValue('route_city_id', '');
          }}
        />
      </FFormGroup>

      {/*----------- Route city -----------*/}
      <FFormGroup
        name={'route_city_id'}
        label={intl.get('route_city')}
        labelInfo={<FieldRequiredHint />}
        inline
        fill
      >
        <CustomerRouteCitySelect
          name={'route_city_id'}
          items={customerRouteCities || []}
          areaId={values.area_id}
          disabled={!values.area_id}
          fill
          buttonProps={{ fill: true }}
        />
      </FFormGroup>

      {/*----------- VAT / TIN number -----------*/}
      <FFormGroup
        name={'tin_number'}
        label={intl.get('tin_number')}
        inline
        fill
      >
        <FInputGroup name={'tin_number'} maxLength={9} fill />
      </FFormGroup>

      <Divider style={{ margin: '20px 0' }} />

      {/*------------ Vendor email -----------*/}
      <FFormGroup name={'email'} label={intl.get('vendor_email')} inline>
        <FInputGroup name={'email'} leftIcon={<Icon icon="envelope" />} />
      </FFormGroup>

      {/*------------ Phone number -----------*/}
      <FFormGroup
        name={'work_phone'}
        className={'form-group--phone-number'}
        label={intl.get('phone_number')}
        inline={true}
      >
        <Stack spacing={10}>
          <FInputGroup
            name={'work_phone'}
            placeholder={intl.get('phone_number_1')}
            leftIcon="phone"
          />
          <FInputGroup
            name={'personal_phone'}
            placeholder={intl.get('phone_number_2')}
          />
        </Stack>
      </FFormGroup>

      {/*------------ Vendor website -----------*/}
      <FFormGroup name={'website'} label={intl.get('website')} inline={true}>
        <FInputGroup
          name={'website'}
          placeholder={'http://'}
          leftIcon={<BlueprintIcon icon="globe-network" />}
        />
      </FFormGroup>
    </Box>
  );
}
