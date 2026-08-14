import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { events } from '@/common/events/events';
import {
  ISaleInvoiceCreatedPayload,
  ISaleInvoiceEditedPayload,
  ISaleInvoiceDeletedPayload,
  ISaleInvoiceEventDeliveredPayload,
} from '../../SaleInvoices/SaleInvoice.types';
import { SaleInvoice } from '../../SaleInvoices/models/SaleInvoice';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { InvoiceLotReservationService } from '../InvoiceLotReservation.service';

/**
 * Keeps item price-lot reservations in sync with a sale invoice's own
 * lifecycle -- see docs/ops/PHASE1.md ("Status pipeline"). Handles the
 * two cases the DMS status endpoint itself can't see: editing an invoice
 * while it's already holding stock (quantities/lots on its lines may have
 * changed), and deleting an invoice outright (its holds must be released,
 * not just cascade-deleted, since releasing also has to give the quantity
 * back to `item_price_lots.reservedQty`).
 */
@Injectable()
export class InvoiceLotReservationSyncSubscriber {
  constructor(
    private readonly reservationService: InvoiceLotReservationService,

    @Inject(SaleInvoice.name)
    private readonly saleInvoiceModel: TenantModelProxy<typeof SaleInvoice>,
  ) {}

  /**
   * Resolves any active holds into a permanent stock decrease and syncs
   * `dms_status` to "delivered" once an invoice is delivered -- no matter
   * whether that happened through the DMS status endpoint or Bigcapital's
   * own native "Save and Deliver" action, so the two can never drift out
   * of sync. See docs/ops/PHASE1.md ("Status pipeline").
   * @param {ISaleInvoiceEventDeliveredPayload} payload -
   */
  @OnEvent(events.saleInvoice.onDelivered)
  public async handleConsumingReservationOnDeliver({
    saleInvoiceId,
    trx,
  }: ISaleInvoiceEventDeliveredPayload) {
    await this.syncDeliveredInvoice(saleInvoiceId, trx);
  }

  /**
   * Covers the case of an invoice created already-delivered in one step
   * (Bigcapital's native "Save and Deliver" button, which never fires
   * `onDelivered` separately) -- without this, a lot-picked line sold
   * this way would never actually decrement its lot's real quantity.
   * @param {ISaleInvoiceCreatedPayload} payload -
   */
  @OnEvent(events.saleInvoice.onCreated)
  public async handleConsumingReservationOnCreateDelivered({
    saleInvoice,
    trx,
  }: ISaleInvoiceCreatedPayload) {
    if (!saleInvoice.deliveredAt) return;

    await this.reservationService.reserveForInvoice(saleInvoice.id, trx);
    await this.syncDeliveredInvoice(saleInvoice.id, trx);
  }

  private async syncDeliveredInvoice(
    saleInvoiceId: number,
    trx: ISaleInvoiceEventDeliveredPayload['trx'],
  ) {
    await this.reservationService.consumeForInvoice(saleInvoiceId, trx);

    await this.saleInvoiceModel()
      .query(trx)
      .where('id', saleInvoiceId)
      .whereNot('dmsStatus', 'delivered')
      .patch({ dmsStatus: 'delivered' } as Partial<SaleInvoice>);
  }

  /**
   * Re-derives the invoice's holds from its current entries whenever it's
   * edited while already Reserved/Invoiced. A no-op for Pending invoices
   * (nothing held yet) and for Delivered ones (holds are already resolved
   * into a permanent stock decrease by then).
   * @param {ISaleInvoiceEditedPayload} payload -
   */
  @OnEvent(events.saleInvoice.onEdited)
  public async handleResyncingReservation({
    saleInvoice,
    trx,
  }: ISaleInvoiceEditedPayload) {
    if (
      saleInvoice.dmsStatus !== 'reserved' &&
      saleInvoice.dmsStatus !== 'invoiced'
    ) {
      return;
    }
    await this.reservationService.reserveForInvoice(saleInvoice.id, trx);
  }

  /**
   * Releases any active holds before the invoice row itself is removed.
   * @param {ISaleInvoiceDeletedPayload} payload -
   */
  @OnEvent(events.saleInvoice.onDeleted)
  public async handleReleasingReservationOnDelete({
    saleInvoiceId,
    trx,
  }: ISaleInvoiceDeletedPayload) {
    await this.reservationService.releaseForInvoice(saleInvoiceId, trx);
  }
}
