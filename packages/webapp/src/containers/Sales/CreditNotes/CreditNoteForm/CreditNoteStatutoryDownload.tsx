// @ts-nocheck
import React from 'react';
import { Button, ButtonGroup, HTMLSelect, Intent } from '@blueprintjs/core';
import { useFormikContext } from 'formik';
import { AppToaster, Group } from '@/components';
import { useCreditNoteFormContext } from './CreditNoteFormProvider';
import { useDownloadStatutoryCreditNote } from '@/hooks/query';

/**
 * VAT / Non-VAT Excel + PDF download for credit notes. Clickable once the
 * credit note is opened and has a number. Due date on the sheet is the
 * credit-note date. See docs/ops/PHASE1.md ("Credit notes").
 */
export function CreditNoteStatutoryDownload() {
  const { creditNote, creditNoteId, customers } = useCreditNoteFormContext();
  const { values } = useFormikContext();
  const { mutateAsync: download, isPending } = useDownloadStatutoryCreditNote();

  const creditNoteNo =
    creditNote?.credit_note_number || values.credit_note_number;
  const isOpen = Boolean(
    creditNote?.opened_at || creditNote?.openedAt || creditNote?.is_published,
  );
  const canDownload =
    Boolean(creditNoteId) && Boolean(creditNoteNo) && isOpen;

  const selectedCustomer = (customers || []).find(
    (customer) => customer.id === values.customer_id,
  );
  const hasTin = Boolean(
    selectedCustomer?.tin_number ||
      selectedCustomer?.tinNumber ||
      creditNote?.customer?.tin_number ||
      creditNote?.customer?.tinNumber,
  );

  const [template, setTemplate] = React.useState(hasTin ? 'vat' : 'non_vat');

  React.useEffect(() => {
    setTemplate(hasTin ? 'vat' : 'non_vat');
  }, [hasTin]);

  const handleDownload = async (fileKind) => {
    if (!canDownload) {
      return;
    }
    try {
      await download({
        creditNoteId,
        template,
        fileKind,
        creditNoteNo,
      });
    } catch (error) {
      AppToaster.show({
        message:
          'Could not download this credit note. Save and open it first so it has a number.',
        intent: Intent.DANGER,
      });
    }
  };

  const disabledHint = canDownload
    ? undefined
    : 'Available once this credit note is saved and opened.';

  return (
    <Group spacing={8} title={disabledHint}>
      <HTMLSelect
        value={template}
        onChange={(event) => setTemplate(event.target.value)}
        disabled={!canDownload || isPending}
      >
        <option value="vat">VAT credit note</option>
        <option value="non_vat">Non-VAT credit note</option>
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
