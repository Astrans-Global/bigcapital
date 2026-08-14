import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  IBillCreatedPayload,
  IBillEditedPayload,
  IBIllEventDeletedPayload,
  IBillOpenedPayload,
} from '../../Bills/Bills.types';
import { events } from '@/common/events/events';
import { RecordItemPriceLotsFromBillService } from '../RecordItemPriceLotsFromBill.service';

/**
 * Keeps Astrans item price-lots in sync with Bill (GRN) lifecycle events,
 * running alongside (not instead of) Bigcapital's own
 * `BillWriteInventoryTransactionsSubscriber`.
 */
@Injectable()
export class BillWriteItemPriceLotsSubscriber {
  constructor(
    private readonly recordItemPriceLotsFromBill: RecordItemPriceLotsFromBillService,
  ) {}

  /**
   * Records item price-lots once a bill is created or opened.
   * @param {IBillCreatedPayload | IBillOpenedPayload} payload -
   */
  @OnEvent(events.bill.onCreated)
  @OnEvent(events.bill.onOpened)
  public async handleRecordingItemPriceLots({
    bill,
    trx,
  }: IBillCreatedPayload | IBillOpenedPayload) {
    if (!bill.openedAt) return;

    await this.recordItemPriceLotsFromBill.recordLotsForBill(
      bill.id,
      false,
      trx,
    );
  }

  /**
   * Re-records item price-lots once a bill is edited.
   * @param {IBillEditedPayload} payload -
   */
  @OnEvent(events.bill.onEdited)
  public async handleRerecordingItemPriceLots({
    bill,
    trx,
  }: IBillEditedPayload) {
    if (!bill.openedAt) return;

    await this.recordItemPriceLotsFromBill.recordLotsForBill(
      bill.id,
      true,
      trx,
    );
  }

  /**
   * Reverts item price-lots once a bill is deleted.
   * @param {IBIllEventDeletedPayload} payload -
   */
  @OnEvent(events.bill.onDeleted)
  public async handleRevertingItemPriceLots({
    billId,
    trx,
  }: IBIllEventDeletedPayload) {
    await this.recordItemPriceLotsFromBill.revertLotsForBill(billId, trx);
  }
}
