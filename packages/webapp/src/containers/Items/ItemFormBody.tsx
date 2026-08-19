// @ts-nocheck
import React from 'react';
import { useFormikContext, FastField, ErrorMessage } from 'formik';
import { FormGroup, Checkbox, Callout, Intent } from '@blueprintjs/core';
import {
  AccountsSelect,
  Col,
  Row,
  Hint,
  FFormGroup,
  FTextArea,
} from '@/components';
import { FormattedMessage as T } from '@/components';

import { useItemFormContext } from './ItemFormProvider';
import { ACCOUNT_PARENT_TYPE } from '@/constants/accountTypes';
import {
  sellDescriptionFieldShouldUpdate,
  sellAccountFieldShouldUpdate,
  costAccountFieldShouldUpdate,
  purchaseDescFieldShouldUpdate,
} from './utils';
import intl from 'react-intl-universal';

/**
 * Item form body.
 *
 * Buy/sell price and item-level VAT boxes are hidden: Astrans prices come
 * from GRN price lots and invoice/receipt lines (list + discount % + VAT).
 * The three account pickers stay — Delivered invoices post Sales / COGS /
 * Inventory from them. See docs/ops/PHASE1.md ("Items").
 */
function ItemFormBodyInner() {
  const { accounts } = useItemFormContext();
  const { values } = useFormikContext();

  return (
    <div class="page-form__section page-form__section--selling-cost">
      <Callout intent={Intent.PRIMARY} style={{ marginBottom: 16 }}>
        Buy price, sell price, and item VAT are not used. Real purchase
        prices come from the bill (GRN) price lot (unit + discount % + VAT).
        Real sell prices come from the invoice or receipt line when you pick
        a lot. Assign the Sales, COGS, and Inventory accounts below — the
        books need those.
      </Callout>
      <Row>
        <Col xs={6}>
          {/*------------- Sellable checkbox ------------- */}
          <FastField name={'sellable'} type="checkbox">
            {({ field }) => (
              <FormGroup inline={true} className={'form-group--sellable'}>
                <Checkbox
                  inline={true}
                  label={
                    <h3>
                      <T id={'i_sell_this_item'} />
                    </h3>
                  }
                  name={'sellable'}
                  {...field}
                />
              </FormGroup>
            )}
          </FastField>

          {/*------------- Selling account ------------- */}
          <FFormGroup
            label={intl.get('account')}
            name={'sell_account_id'}
            labelInfo={
              <Hint content={<T id={'item.field.sell_account.hint'} />} />
            }
            inline={true}
            items={accounts}
            sellable={values.sellable}
            shouldUpdate={sellAccountFieldShouldUpdate}
            fastField={true}
          >
            <AccountsSelect
              name={'sell_account_id'}
              items={accounts}
              placeholder={<T id={'select_account'} />}
              disabled={!values.sellable}
              filterByParentTypes={[ACCOUNT_PARENT_TYPE.INCOME]}
              fill={true}
              allowCreate={true}
              fastField={true}
            />
          </FFormGroup>

          <FFormGroup
            name={'sell_description'}
            label={intl.get('description')}
            inline={true}
            sellable={values.sellable}
            shouldUpdate={sellDescriptionFieldShouldUpdate}
            fastField
          >
            <FTextArea
              name={'sell_description'}
              growVertically={true}
              height={280}
              disabled={!values.sellable}
              fill
              fastField
            />
          </FFormGroup>
        </Col>

        <Col xs={6}>
          {/*------------- Purchasable checkbox ------------- */}
          <FastField name={'purchasable'} type={'checkbox'}>
            {({ field }) => (
              <FormGroup inline={true} className={'form-group--purchasable'}>
                <Checkbox
                  inline={true}
                  label={
                    <h3>
                      <T id={'i_purchase_this_item'} />
                    </h3>
                  }
                  {...field}
                />
              </FormGroup>
            )}
          </FastField>

          {/*------------- Cost account ------------- */}
          <FFormGroup
            name={'cost_account_id'}
            purchasable={values.purchasable}
            items={accounts}
            shouldUpdate={costAccountFieldShouldUpdate}
            label={intl.get('account')}
            labelInfo={
              <Hint content={<T id={'item.field.cost_account.hint'} />} />
            }
            inline={true}
            fastField={true}
          >
            <AccountsSelect
              name={'cost_account_id'}
              items={accounts}
              placeholder={<T id={'select_account'} />}
              filterByParentTypes={[ACCOUNT_PARENT_TYPE.EXPENSE]}
              popoverFill={true}
              allowCreate={true}
              fastField={true}
              disabled={!values.purchasable}
              purchasable={values.purchasable}
              shouldUpdate={costAccountFieldShouldUpdate}
            />
          </FFormGroup>

          <FFormGroup
            name={'purchase_description'}
            label={intl.get('description')}
            className={'form-group--purchase-description'}
            helperText={<ErrorMessage name={'description'} />}
            inline={true}
            purchasable={values.purchasable}
            shouldUpdate={purchaseDescFieldShouldUpdate}
          >
            <FTextArea
              name={'purchase_description'}
              growVertically={true}
              height={280}
              disabled={!values.purchasable}
              fill
            />
          </FFormGroup>
        </Col>
      </Row>
    </div>
  );
}

export const ItemFormBody = ItemFormBodyInner;
