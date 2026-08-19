// @ts-nocheck
import React from 'react';
import { Button, ButtonGroup, Intent } from '@blueprintjs/core';
import { useFormikContext } from 'formik';
import { AppToaster, Group } from '@/components';
import { useQuotationFormContext } from './QuotationFormProvider';
import { useDownloadStatutoryQuotation } from '@/hooks/query';

export function QuotationStatutoryDownload() {
  const { quotation, quotationId } = useQuotationFormContext();
  const { values } = useFormikContext();
  const { mutateAsync: download, isPending } = useDownloadStatutoryQuotation();

  const quotationNo = quotation?.quotation_number || values.quotation_number;
  const canDownload = Boolean(quotationId) && Boolean(quotationNo);

  const handleDownload = async (fileKind) => {
    if (!canDownload) return;
    try {
      await download({
        quotationId,
        fileKind,
        quotationNo,
      });
    } catch (error) {
      AppToaster.show({
        message: 'Could not download this quotation. Save it first.',
        intent: Intent.DANGER,
      });
    }
  };

  return (
    <Group
      spacing={8}
      title={
        canDownload ? undefined : 'Available once this quotation is saved.'
      }
    >
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
