// @ts-nocheck
import React from 'react';
import {
  Intent,
  Button,
  ButtonGroup,
  Popover,
  PopoverInteractionKind,
  Position,
  Menu,
  MenuItem,
} from '@blueprintjs/core';
import { Icon, FormattedMessage as T, Group, FSelect } from '@/components';
import { useHistory } from 'react-router-dom';
import { useFormikContext } from 'formik';
import { useEstimateFormContext } from './EstimateFormProvider';
import { useEstimateFormBrandingTemplatesOptions } from './utils';
import { useDrawerActions } from '@/hooks/state';
import {
  BrandingThemeFormGroup,
  BrandingThemeSelectButton,
} from '@/containers/BrandingTemplates/BrandingTemplatesSelectFields';
import { PageForm } from '@/components/PageForm';
import { MoreIcon } from '@/icons/More';
import { DRAWERS } from '@/constants/drawers';
import { AppToaster } from '@/components';

/**
 * Estimate floating actions: Save / Clear / Cancel, plus Send to pending.
 * Save and Deliver is hidden so an estimate cannot skip into a delivered
 * invoice. See docs/ops/PHASE1.md ("Estimates").
 */
export function EstimateFloatingActions() {
  const history = useHistory();
  const { openDrawer } = useDrawerActions();
  const { resetForm, submitForm, isSubmitting, values } = useFormikContext();
  const { estimate, estimateId, setSubmitPayload } = useEstimateFormContext();

  const alreadyConverted = Boolean(
    estimate?.is_converted_to_invoice ||
      estimate?.converted_to_invoice_id ||
      estimate?.convertedToInvoiceId,
  );

  const handleSubmitDraftBtnClick = () => {
    setSubmitPayload({ redirect: true, deliver: false });
    submitForm();
  };

  const handleSubmitDraftAndNewBtnClick = () => {
    setSubmitPayload({ redirect: false, deliver: false, resetForm: true });
    submitForm();
  };

  const handleSubmitDraftContinueEditingBtnClick = () => {
    setSubmitPayload({ redirect: false, deliver: false });
    submitForm();
  };

  const handleSendToPending = () => {
    if (!estimateId) {
      AppToaster.show({
        message: 'Save the estimate first, then send it to a Pending invoice.',
        intent: Intent.WARNING,
      });
      return;
    }
    if (alreadyConverted) {
      AppToaster.show({
        message: 'This estimate was already sent to an invoice.',
        intent: Intent.WARNING,
      });
      return;
    }
    history.push(`/invoices/new?from_estimate_id=${estimateId}`, {
      action: String(estimateId),
    });
  };

  const handleCancelBtnClick = () => {
    history.goBack();
  };

  const handleClearBtnClick = () => {
    resetForm();
  };

  const handleCustomizeBtnClick = () => {
    openDrawer(DRAWERS.BRANDING_TEMPLATES, { resource: 'SaleEstimate' });
  };

  const brandingTemplatesOptions = useEstimateFormBrandingTemplatesOptions();

  return (
    <PageForm.FooterActions position={'apart'} spacing={10}>
      <Group spacing={10}>
        <ButtonGroup>
          <Button
            disabled={isSubmitting}
            loading={isSubmitting}
            intent={Intent.PRIMARY}
            onClick={handleSubmitDraftBtnClick}
            text={<T id={'save'} />}
          />
          <Popover
            content={
              <Menu>
                <MenuItem
                  text={<T id={'save_and_new'} />}
                  onClick={handleSubmitDraftAndNewBtnClick}
                />
                <MenuItem
                  text={<T id={'save_continue_editing'} />}
                  onClick={handleSubmitDraftContinueEditingBtnClick}
                />
              </Menu>
            }
            minimal={true}
            interactionKind={PopoverInteractionKind.CLICK}
            position={Position.BOTTOM_LEFT}
          >
            <Button
              disabled={isSubmitting}
              intent={Intent.PRIMARY}
              rightIcon={<Icon icon="arrow-drop-up-16" iconSize={20} />}
            />
          </Popover>
        </ButtonGroup>

        <Button
          disabled={isSubmitting || alreadyConverted}
          intent={Intent.SUCCESS}
          onClick={handleSendToPending}
          text={'Send to pending'}
        />

        <Button
          className={'ml1'}
          disabled={isSubmitting}
          onClick={handleClearBtnClick}
          text={estimate ? <T id={'reset'} /> : <T id={'clear'} />}
        />

        <Button
          className={'ml1'}
          disabled={isSubmitting}
          onClick={handleCancelBtnClick}
          text={<T id={'cancel'} />}
        />
      </Group>

      <Group spacing={0}>
        <BrandingThemeFormGroup
          name={'pdf_template_id'}
          label={'Branding'}
          inline
          fastField
          style={{ marginLeft: 20 }}
        >
          <FSelect
            name={'pdf_template_id'}
            items={brandingTemplatesOptions}
            input={({ activeItem, text, label, value }) => (
              <BrandingThemeSelectButton text={text || 'Brand Theme'} minimal />
            )}
            filterable={false}
            popoverProps={{ minimal: true }}
          />
        </BrandingThemeFormGroup>

        <Popover
          minimal={true}
          interactionKind={PopoverInteractionKind.CLICK}
          position={Position.TOP_RIGHT}
          modifiers={{
            offset: { offset: '0, 4' },
          }}
          content={
            <Menu>
              <MenuItem
                text={'Customize Templates'}
                onClick={handleCustomizeBtnClick}
              />
            </Menu>
          }
        >
          <Button minimal icon={<MoreIcon height={'14px'} width={'14px'} />} />
        </Popover>
      </Group>
    </PageForm.FooterActions>
  );
}
