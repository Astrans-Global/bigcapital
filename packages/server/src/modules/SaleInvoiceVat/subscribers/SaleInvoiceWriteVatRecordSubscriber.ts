import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { events } from '@/common/events/events';
import {
  ISaleInvoiceCreatedPayload,
  ISaleInvoiceEditedPayload,
  ISaleInvoiceDeletedPayload,
  ISaleInvoiceEventDeliveredPayload,
} from '../../SaleInvoices/SaleInvoice.types';
import { RecordSaleInvoiceVatFromInvoiceService } from '../RecordSaleInvoiceVatFromInvoice.service';

/**
 * Keeps `sale_invoice_vat_records` in sync with a sale invoice's lifecycle
 * -- only Delivered invoices are real sales (Pending/Reserved/Invoiced
 * never hit GL, see docs/ops/PHASE1.md "Status pipeline"), so this only
 * records/updates once `deliveredAt` is set, and removes the record if the
 * invoice is deleted. Mirrors `InvoiceLotReservationSyncSubscriber`'s
 * gating logic exactly.
 */
@Injectable()
export class SaleInvoiceWriteVatRecordSubscriber {
  constructor(
    private readonly recordVatFromInvoice: RecordSaleInvoiceVatFromInvoiceService,
  ) {}

  /**
   * Records VAT once an invoice is delivered via the DMS status endpoint
   * (or Bigcapital's own native "deliver" action).
   * @param {ISaleInvoiceEventDeliveredPayload} payload -
   */
  @OnEvent(events.saleInvoice.onDelivered)
  public async handleRecordingVatOnDeliver({
    saleInvoiceId,
    trx,
  }: ISaleInvoiceEventDeliveredPayload) {
    await this.recordVatFromInvoice.recordVatForInvoice(saleInvoiceId, trx);
  }

  /**
   * Covers the case of an invoice created already-delivered in one step
   * (Bigcapital's native "Save and Deliver" button, which never fires
   * `onDelivered` separately).
   * @param {ISaleInvoiceCreatedPayload} payload -
   */
  @OnEvent(events.saleInvoice.onCreated)
  public async handleRecordingVatOnCreateDelivered({
    saleInvoice,
    trx,
  }: ISaleInvoiceCreatedPayload) {
    if (!saleInvoice.deliveredAt) return;

    await this.recordVatFromInvoice.recordVatForInvoice(saleInvoice.id, trx);
  }

  /**
   * Re-records VAT if a Delivered invoice is edited -- phase 1 allows
   * editing/reverse+repost after delivery (see docs/ops/PHASE1.md "Status
   * pipeline"), so the VAT snapshot must track those edits too.
   * @param {ISaleInvoiceEditedPayload} payload -
   */
  @OnEvent(events.saleInvoice.onEdited)
  public async handleRerecordingVat({
    saleInvoice,
    trx,
  }: ISaleInvoiceEditedPayload) {
    if (!saleInvoice.deliveredAt) return;

    await this.recordVatFromInvoice.recordVatForInvoice(saleInvoice.id, trx);
  }

  /**
   * Removes the invoice's VAT record once it's deleted.
   * @param {ISaleInvoiceDeletedPayload} payload -
   */
  @OnEvent(events.saleInvoice.onDeleted)
  public async handleRevertingVat({
    saleInvoiceId,
    trx,
  }: ISaleInvoiceDeletedPayload) {
    await this.recordVatFromInvoice.revertVatForInvoice(saleInvoiceId, trx);
  }
}
