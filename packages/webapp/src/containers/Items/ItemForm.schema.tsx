// @ts-nocheck
import * as Yup from 'yup';
import { defaultTo } from 'lodash';
import intl from 'react-intl-universal';
import { DATATYPES_LENGTH } from '@/constants/dataTypes';

const Schema = Yup.object().shape({
  active: Yup.boolean(),
  name: Yup.string()
    .required()
    .min(0)
    .max(DATATYPES_LENGTH.STRING)
    .label(intl.get('item_name_')),
  type: Yup.string()
    .trim()
    .required()
    .min(0)
    .max(DATATYPES_LENGTH.STRING)
    .label(intl.get('item_type_')),
  code: Yup.string().trim().min(0).max(DATATYPES_LENGTH.STRING),
  // Buy/sell prices are leftover fallbacks — real prices live on GRN
  // price lots / invoice lines. Hidden on the form; 0 is fine.
  cost_price: Yup.number()
    .min(0)
    .max(DATATYPES_LENGTH.DECIMAL_13_3)
    .nullable(true)
    .transform((value, original) => (original === '' || original == null ? 0 : value)),
  sell_price: Yup.number()
    .min(0)
    .max(DATATYPES_LENGTH.DECIMAL_13_3)
    .nullable(true)
    .transform((value, original) => (original === '' || original == null ? 0 : value)),
  cost_account_id: Yup.number()
    .when(['purchasable'], {
      is: true,
      then: Yup.number().required(),
      otherwise: Yup.number().nullable(true),
    })
    .label(intl.get('cost_account_id')),
  sell_account_id: Yup.number()
    .when(['sellable'], {
      is: true,
      then: Yup.number().required(),
      otherwise: Yup.number().nullable(),
    })
    .label(intl.get('sell_account_id')),
  inventory_account_id: Yup.number()
    .when(['type'], {
      is: (value) => value === 'inventory',
      then: Yup.number().required(),
      otherwise: Yup.number().nullable(),
    })
    .label(intl.get('inventory_account')),
  category_id: Yup.number().positive().nullable(),
  subcategory_id: Yup.number().positive().nullable(),
  pack_size_litres: Yup.number()
    .min(0)
    .max(DATATYPES_LENGTH.DECIMAL_13_3)
    .nullable()
    .label(intl.get('pack_size_litres')),
  stock: Yup.string() || Yup.boolean(),
  sellable: Yup.boolean().required(),
  purchasable: Yup.boolean().required(),
});

export const transformItemFormData = (item, defaultValue) => {
  return {
    ...item,
    // The API returns camelCase (`categoryId`/`subcategoryId`) while the form
    // still keys these fields in snake_case, so map them across explicitly.
    category_id: defaultTo(item?.categoryId, item?.category_id ?? null),
    subcategory_id: defaultTo(item?.subcategoryId, item?.subcategory_id ?? null),
    pack_size_litres: defaultTo(
      item?.packSizeLitres,
      item?.pack_size_litres ?? null,
    ),
    sellable: !!defaultTo(item?.sellable, defaultValue.sellable),
    purchasable: !!defaultTo(item?.purchasable, defaultValue.purchasable),
    active: !!defaultTo(item?.active, defaultValue.active),
  };
};

export const CreateItemFormSchema = Schema;
export const EditItemFormSchema = Schema;
