// @ts-nocheck
import React from 'react';
import { Button, ButtonGroup, HTMLSelect, Intent } from '@blueprintjs/core';
import { useFormikContext } from 'formik';
import { AppToaster, Group } from '@/components';
import { useReceiptFormContext } from './ReceiptFormProvider';
import { useDownloadStatutoryReceipt } from '@/hooks/query';

/**
 * VAT / Non-VAT Excel + PDF download for cash sales. Clickable once the
 * receipt is closed and has a number. Due date on the sheet is the
 * receipt date. See docs/ops/PHASE1.md ("Sales receipts").
 */
export function ReceiptStatutoryDownload() {
  const { receipt, receiptId, customers } = useReceiptFormContext();
  const { values } = useFormikContext();
  const { mutateAsync: download, isPending } = useDownloadStatutoryReceipt();

  const receiptNo = receipt?.receipt_number || values.receipt_number;
  const isClosed = Boolean(receipt?.closed_at || receipt?.closedAt);
  const canDownload = Boolean(receiptId) && Boolean(receiptNo) && isClosed;

  const selectedCustomer = (customers || []).find(
    (customer) => customer.id === values.customer_id,
  );
  const hasTin = Boolean(
    selectedCustomer?.tin_number ||
      selectedCustomer?.tinNumber ||
      receipt?.customer?.tin_number ||
      receipt?.customer?.tinNumber,
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
        receiptId,
        template,
        fileKind,
        receiptNo,
      });
    } catch (error) {
      AppToaster.show({
        message:
          'Could not download this receipt. Save and close it first so it has a number.',
        intent: Intent.DANGER,
      });
    }
  };

  const disabledHint = canDownload
    ? undefined
    : 'Available once this receipt is saved and closed.';

  return (
    <Group spacing={8} title={disabledHint}>
      <HTMLSelect
        value={template}
        onChange={(event) => {
          userChoseTemplate.current = true;
          setTemplate(event.currentTarget.value);
        }}
        disabled={isPending}
      >
        <option value="vat">VAT invoice</option>
        <option value="non_vat">Non-VAT invoice</option>
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
