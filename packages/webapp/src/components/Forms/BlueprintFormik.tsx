import React from 'react';
import {
  FormGroup,
  InputGroup,
  NumericInput,
  Checkbox,
  RadioGroup,
  Switch,
  EditableText,
  TextArea,
  HTMLSelect,
} from '@blueprintjs-formik/core';
import {
  MultiSelect,
  Suggest,
  Select,
  FormikMultiSelect,
  FormikSuggest,
  withFormikMultiSelect,
  withFormikSuggest,
  withFormikSelect,
} from '@blueprintjs-formik/select';
import {
  DateInput as BPFormikDateInput,
  TimezoneSelect,
} from '@blueprintjs-formik/datetime';
import { FSelect } from './Select';
import { asSelectItems } from './asSelectItems';

function toDateOrNull(value: unknown): Date | null {
  if (value == null || value === '') {
    return null;
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function FDateInput(
  props: React.ComponentProps<typeof BPFormikDateInput>,
) {
  return (
    <BPFormikDateInput
      {...props}
      formParseDate={props.formParseDate ?? toDateOrNull}
      formFormatDate={
        props.formFormatDate ?? ((date) => date as unknown as string)
      }
    />
  );
}

export function FMultiSelect(
  props: React.ComponentProps<typeof FormikMultiSelect>,
) {
  return (
    <FormikMultiSelect {...props} items={asSelectItems(props.items)} />
  );
}

export {
  FormGroup as FFormGroup,
  InputGroup as FInputGroup,
  NumericInput as FNumericInput,
  Checkbox as FCheckbox,
  RadioGroup as FRadioGroup,
  Switch as FSwitch,
  FSelect,
  EditableText as FEditableText,
  FormikSuggest as FSuggest,
  TextArea as FTextArea,
  HTMLSelect as FHTMLSelect,
  TimezoneSelect as FTimezoneSelect,
  Suggest,
  MultiSelect,
  Select,
  withFormikSelect,
  withFormikMultiSelect,
  withFormikSuggest,
};
