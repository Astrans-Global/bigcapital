// @ts-nocheck
import React from 'react';
import { Button, ButtonGroup, HTMLSelect, Intent } from '@blueprintjs/core';
import { useFormikContext } from 'formik';
import { AppToaster, Group } from '@/components';
import { useInvoiceFormContext } from './InvoiceFormProvider';
import { useDownloadStatutoryInvoice } from '@/hooks/query';

/**
 * VAT / Non-VAT Excel + PDF download. Always visible in the invoice
 * header (above the outstanding-invoices panel). Clickable only once the
 * invoice is Invoiced or Delivered and has a number — otherwise the
 * controls stay on screen but disabled. See docs/ops/PHASE1.md ("VAT").
 */
export function InvoiceStatutoryDownload() {
  const { invoice, invoiceId, customers } = useInvoiceFormContext();
  const { values } = useFormikContext();
  const { mutateAsync: download, isPending } = useDownloadStatutoryInvoice();

  const status = invoice?.dms_status || 'pending';
  const invoiceNo = invoice?.invoice_no || values.invoice_no;
  const canDownload =
    Boolean(invoiceId) &&
    Boolean(invoiceNo) &&
    (status === 'invoiced' || status === 'delivered');

  const selectedCustomer = (customers || []).find(
    (customer) => customer.id === values.customer_id,
  );
  const hasTin = Boolean(
    selectedCustomer?.tin_number ||
      selectedCustomer?.tinNumber ||
      invoice?.customer?.tin_number ||
      invoice?.customer?.tinNumber,
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
        invoiceId,
        template,
        fileKind,
        invoiceNo,
      });
    } catch (error) {
      AppToaster.show({
        message:
          'Could not download this invoice. Check that it is Invoiced or Delivered and has an invoice number.',
        intent: Intent.DANGER,
      });
    }
  };

  const disabledHint = canDownload
    ? undefined
    : 'Available once this invoice is Invoiced or Delivered.';

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
