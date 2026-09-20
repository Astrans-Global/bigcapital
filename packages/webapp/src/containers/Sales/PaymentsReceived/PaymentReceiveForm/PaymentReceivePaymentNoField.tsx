// @ts-nocheck
import React from 'react';
import { useFormikContext } from 'formik';
import * as R from 'ramda';

import { FInputGroup, FFormGroup, FieldRequiredHint } from '@/components';
import { withSettings } from '@/containers/Settings/withSettings';
import { usePaymentReceiveFormContext } from './PaymentReceiveFormProvider';
import {
  chequeAreaLetter,
  previewCollectionNumber,
} from './collectionNumber';
import { useCustomerAreas } from '@/hooks/query';
import intl from 'react-intl-universal';

function chequeSettingsFromAll(allSettings, areaName) {
  if (!areaName) {
    return undefined;
  }
  const letter = chequeAreaLetter(areaName);
  return allSettings?.[`pdCheques${letter}`];
}

/**
 * Payment receive number field — always auto-generated, never manual.
 */
export const PaymentReceivePaymentNoField = R.compose(
  withSettings(
    ({
      allSettings,
      paymentReceivesCashSettings,
      paymentReceivesBankTransferSettings,
      paymentReceivesBankDepositSettings,
    }) => ({
      allSettings,
      cashNumberSettings: paymentReceivesCashSettings,
      bankTransferNumberSettings: paymentReceivesBankTransferSettings,
      bankDepositNumberSettings: paymentReceivesBankDepositSettings,
    }),
  ),
)(({
  allSettings,
  cashNumberSettings,
  bankTransferNumberSettings,
  bankDepositNumberSettings,
}) => {
  const { values } = useFormikContext();
  const { isNewMode } = usePaymentReceiveFormContext();
  const { data: areas } = useCustomerAreas();
  const method = values.payment_method;
  const area = (areas || []).find(
    (item) => String(item.id) === String(values.area_id),
  );
  const settingsByMethod = {
    cash: cashNumberSettings,
    bank_transfer: bankTransferNumberSettings,
    bank_deposit: bankDepositNumberSettings,
    pd_cheque: chequeSettingsFromAll(allSettings, area?.name),
  };
  const preview = method
    ? previewCollectionNumber(method, settingsByMethod[method], {
        areaName: area?.name,
      })
    : '';
  const displayValue = isNewMode ? preview : values.payment_receive_no;
  const labelId =
    method === 'pd_cheque' ? 'cheque_document_no' : 'payment_received_no';

  return (
    <FFormGroup
      name={'payment_receive_no'}
      label={intl.get(labelId)}
      inline={true}
      labelInfo={<FieldRequiredHint />}
      helperText={
        isNewMode ? intl.get('payment_number_assigned_on_save') : null
      }
    >
      <FInputGroup
        name={'payment_receive_no'}
        minimal={true}
        value={displayValue}
        disabled={true}
        placeholder={
          method ? displayValue : intl.get('select_payment_method_first')
        }
      />
    </FFormGroup>
  );
});

PaymentReceivePaymentNoField.displayName = 'PaymentReceivePaymentNoField';
