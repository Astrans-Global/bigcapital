// @ts-nocheck
import * as Yup from 'yup';
import { DATATYPES_LENGTH } from '@/constants/dataTypes';
import { isBlank } from '@/utils';

export const QuotationFormSchema = Yup.object().shape({
  company_name: Yup.string().required().label('Company Name'),
  quotation_date: Yup.date().required().label('Date'),
  address_to: Yup.string().nullable(),
  address_line_1: Yup.string().nullable(),
  address_line_2: Yup.string().nullable(),
  warehouse_id: Yup.string().nullable(),
  entries: Yup.array()
    .max(12)
    .of(
      Yup.object().shape({
        quantity: Yup.number()
          .nullable()
          .max(DATATYPES_LENGTH.INT_10)
          .when(['rate'], {
            is: (rate) => rate,
            then: Yup.number().required(),
          }),
        rate: Yup.number().nullable().max(DATATYPES_LENGTH.INT_10),
        item_id: Yup.number()
          .nullable()
          .when(['quantity', 'rate'], {
            is: (quantity, rate) => !isBlank(quantity) && !isBlank(rate),
            then: Yup.number().required(),
          }),
        discount: Yup.number().nullable().min(0).max(100),
      }),
    ),
});
