// @ts-nocheck
import React, { useCallback } from 'react';
import {
  FormGroup,
  Intent,
  Menu,
  MenuItem,
  Popover,
  Position,
  Tag,
} from '@blueprintjs/core';
import { AppToaster } from '@/components';
import { useInvoiceFormContext } from './InvoiceFormProvider';
import { useSetSaleInvoiceDmsStatus } from '@/hooks/query';

const STATUS_LABELS = {
  pending: 'Pending',
  reserved: 'Reserved',
  invoiced: 'Invoiced',
  delivered: 'Delivered',
};

const STATUS_INTENT = {
  pending: Intent.NONE,
  reserved: Intent.PRIMARY,
  invoiced: Intent.WARNING,
  delivered: Intent.SUCCESS,
};

const STATUS_ORDER = ['pending', 'reserved', 'invoiced', 'delivered'];

/**
 * Astrans DMS invoice status control (Pending -> Reserved -> Invoiced ->
 * Delivered) -- see docs/ops/PHASE1.md ("Status pipeline"). Only shown for
 * an already-saved invoice (new/unsaved invoices always start life as
 * Pending automatically, nothing to control yet). Moving to "Delivered"
 * here drives Bigcapital's own native GL/inventory-posting flow server-side
 * (see `InvoiceDmsStatusService`), so it can't be undone from this control
 * once set -- the menu simply won't offer other statuses at that point.
 */
export function InvoiceDmsStatusControl() {
  const { invoice, invoiceId } = useInvoiceFormContext();
  const { mutateAsync: setDmsStatus, isPending } =
    useSetSaleInvoiceDmsStatus();

  const handleStatusSelect = useCallback(
    async (status) => {
      try {
        await setDmsStatus([invoiceId, status]);
        AppToaster.show({
          message: `Invoice moved to "${STATUS_LABELS[status]}".`,
          intent: Intent.SUCCESS,
        });
      } catch (error) {
        const errors = error?.response?.data?.errors || [];
        const lotError = errors.find(
          (e) => e.type === 'ITEM_PRICE_LOT_INSUFFICIENT_STOCK',
        );
        const deliveredError = errors.find(
          (e) => e.type === 'INVOICE_ALREADY_DELIVERED',
        );

        if (lotError) {
          AppToaster.show({
            message:
              `Not enough stock left in that price lot -- only ${lotError.payload?.floatQty} ` +
              `available, but ${lotError.payload?.requestedQty} was requested. ` +
              `Lower the quantity or pick a different lot on that line.`,
            intent: Intent.DANGER,
          });
        } else if (deliveredError) {
          AppToaster.show({
            message:
              'This invoice is already delivered and posted to the accounts -- its status can no longer be changed here.',
            intent: Intent.DANGER,
          });
        } else {
          AppToaster.show({
            message: 'Could not change the invoice status.',
            intent: Intent.DANGER,
          });
        }
      }
    },
    [setDmsStatus, invoiceId],
  );

  if (!invoiceId || !invoice) return null;

  const currentStatus = invoice.dms_status || 'pending';
  const isDelivered = currentStatus === 'delivered';

  return (
    <FormGroup label={'Status'} inline style={{ marginRight: 16 }}>
      <Popover
        minimal
        disabled={isDelivered || isPending}
        position={Position.BOTTOM_LEFT}
        content={
          <Menu>
            {STATUS_ORDER.map((status) => (
              <MenuItem
                key={status}
                text={STATUS_LABELS[status]}
                active={status === currentStatus}
                disabled={status === currentStatus}
                onClick={() => handleStatusSelect(status)}
              />
            ))}
          </Menu>
        }
      >
        <Tag
          interactive={!isDelivered}
          intent={STATUS_INTENT[currentStatus]}
          round
          rightIcon={!isDelivered ? 'caret-down' : undefined}
        >
          {STATUS_LABELS[currentStatus]}
        </Tag>
      </Popover>
    </FormGroup>
  );
}
