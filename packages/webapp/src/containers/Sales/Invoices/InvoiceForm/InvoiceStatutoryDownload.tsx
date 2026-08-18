// @ts-nocheck
import React from 'react';
import { Button, ButtonGroup, HTMLSelect, Intent } from '@blueprintjs/core';
import { useFormikContext } from 'formik';
import { AppToaster, Group } from '@/components';
import { useInvoiceFormContext } from './InvoiceFormProvider';
import { useDownloadStatutoryInvoice } from '@/hooks/query';

/**
 * Download the filled VAT / Non-VAT Excel (or a PDF of that same sheet)
 * once the invoice has a real number (Invoiced or Delivered). Lives next
 * to the DMS status dropdown in the invoice top bar.
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

  React.useEffect(() => {
    setTemplate(hasTin ? 'vat' : 'non_vat');
  }, [hasTin]);

  if (!canDownload) {
    return null;
  }

  const handleDownload = async (fileKind) => {
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

  return (
    <Group spacing={8} style={{ marginLeft: 12 }}>
      <HTMLSelect
        value={template}
        onChange={(event) => setTemplate(event.target.value)}
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
          onClick={() => handleDownload('xlsx')}
        >
          Excel
        </Button>
        <Button
          small
          loading={isPending}
          onClick={() => handleDownload('pdf')}
        >
          PDF
        </Button>
      </ButtonGroup>
    </Group>
  );
}
