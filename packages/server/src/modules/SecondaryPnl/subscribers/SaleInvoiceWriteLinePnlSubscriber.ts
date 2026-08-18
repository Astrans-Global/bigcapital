import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { events } from '@/common/events/events';
import {
  ISaleInvoiceCreatedPayload,
  ISaleInvoiceEditedPayload,
  ISaleInvoiceDeletedPayload,
  ISaleInvoiceEventDeliveredPayload,
} from '../../SaleInvoices/SaleInvoice.types';
import { RecordSaleInvoiceLinePnlService } from '../RecordSaleInvoiceLinePnl.service';

/**
 * Keeps `sale_invoice_line_pnls` in sync with a sale invoice's lifecycle,
 * same gating as `SaleInvoiceWriteVatRecordSubscriber` -- only Delivered
 * invoices are real sales, see docs/ops/PHASE1.md ("Status pipeline",
 * "Secondary P&L").
 */
@Injectable()
export class SaleInvoiceWriteLinePnlSubscriber {
  constructor(
    private readonly recordLinePnl: RecordSaleInvoiceLinePnlService,
  ) {}

  /**
   * Snapshots P&L once an invoice is delivered.
   * @param {ISaleInvoiceEventDeliveredPayload} payload -
   */
  @OnEvent(events.saleInvoice.onDelivered)
  public async handleRecordingPnlOnDeliver({
    saleInvoiceId,
    trx,
  }: ISaleInvoiceEventDeliveredPayload) {
    await this.recordLinePnl.recordPnlForInvoice(saleInvoiceId, trx);
  }

  /**
   * Covers an invoice created already-delivered in one step (Bigcapital's
   * native "Save and Deliver" button).
   * @param {ISaleInvoiceCreatedPayload} payload -
   */
  @OnEvent(events.saleInvoice.onCreated)
  public async handleRecordingPnlOnCreateDelivered({
    saleInvoice,
    trx,
  }: ISaleInvoiceCreatedPayload) {
    if (!saleInvoice.deliveredAt) return;

    await this.recordLinePnl.recordPnlForInvoice(saleInvoice.id, trx);
  }

  /**
   * Re-snapshots P&L if a Delivered invoice is edited (phase 1 allows
   * editing/reverse+repost after delivery).
   * @param {ISaleInvoiceEditedPayload} payload -
   */
  @OnEvent(events.saleInvoice.onEdited)
  public async handleResnapshottingPnl({
    saleInvoice,
    trx,
  }: ISaleInvoiceEditedPayload) {
    if (!saleInvoice.deliveredAt) return;

    await this.recordLinePnl.recordPnlForInvoice(saleInvoice.id, trx);
  }

  /**
   * Removes the invoice's P&L snapshot rows once it's deleted.
   * @param {ISaleInvoiceDeletedPayload} payload -
   */
  @OnEvent(events.saleInvoice.onDeleted)
  public async handleClearingPnl({
    saleInvoiceId,
    trx,
  }: ISaleInvoiceDeletedPayload) {
    await this.recordLinePnl.clearPnlForInvoice(saleInvoiceId, trx);
  }
}
