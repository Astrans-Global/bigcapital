// @ts-nocheck
import React from 'react';
import { Button, ButtonGroup, HTMLSelect, Intent } from '@blueprintjs/core';
import { useFormikContext } from 'formik';
import { AppToaster, Group } from '@/components';
import { useEstimateFormContext } from './EstimateFormProvider';
import { useDownloadStatutoryEstimate } from '@/hooks/query';

/**
 * VAT / Non-VAT Excel + PDF for estimates. Allowed as soon as the estimate
 * is saved — invoice number and due date print as N/A.
 */
export function EstimateStatutoryDownload() {
  const { estimate, estimateId, customers } = useEstimateFormContext();
  const { values } = useFormikContext();
  const { mutateAsync: download, isPending } = useDownloadStatutoryEstimate();

  const savedId = estimateId || estimate?.id;
  const canDownload = Boolean(savedId);

  const selectedCustomer = (customers || []).find(
    (customer) => Number(customer.id) === Number(values.customer_id),
  );
  const hasTin = Boolean(
    selectedCustomer?.tin_number ||
      selectedCustomer?.tinNumber ||
      estimate?.customer?.tin_number ||
      estimate?.customer?.tinNumber,
  );

  const [template, setTemplate] = React.useState(hasTin ? 'vat' : 'non_vat');
  const userChoseTemplate = React.useRef(false);

  React.useEffect(() => {
    if (userChoseTemplate.current) {
      return;
    }
    setTemplate(hasTin ? 'vat' : 'non_vat');
  }, [hasTin]);

  const handleDownload = async (fileKind) => {
    if (!canDownload) {
      return;
    }
    try {
      await download({
        estimateId: savedId,
        template,
        fileKind,
        estimateNo:
          estimate?.estimate_number || values.estimate_number || 'ESTIMATE',
      });
    } catch (error) {
      AppToaster.show({
        message: 'Could not download this estimate. Save it first.',
        intent: Intent.DANGER,
      });
    }
  };

  return (
    <Group
      spacing={8}
      align="center"
      style={{ position: 'relative', zIndex: 6 }}
      title={canDownload ? undefined : 'Available once this estimate is saved.'}
    >
      <HTMLSelect
        value={template}
        onChange={(event) => {
          userChoseTemplate.current = true;
          setTemplate(event.target.value);
        }}
        disabled={isPending}
      >
        <option value="vat">VAT estimate</option>
        <option value="non_vat">Non-VAT estimate</option>
      </HTMLSelect>
      <ButtonGroup>
        <Button
          small
          intent={Intent.PRIMARY}
          loading={isPending}
          disabled={!canDownload}
          onClick={() => handleDownload('xlsx')}
        >
          Excel
        </Button>
        <Button
          small
          loading={isPending}
          disabled={!canDownload}
          onClick={() => handleDownload('pdf')}
        >
          PDF
        </Button>
      </ButtonGroup>
    </Group>
  );
}
