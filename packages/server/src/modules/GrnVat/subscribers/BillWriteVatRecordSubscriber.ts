import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  IBillCreatedPayload,
  IBillEditedPayload,
  IBIllEventDeletedPayload,
  IBillOpenedPayload,
} from '../../Bills/Bills.types';
import { events } from '@/common/events/events';
import { RecordBillVatFromBillService } from '../RecordBillVatFromBill.service';

/**
 * Keeps `bill_vat_records` in sync with Bill (GRN) lifecycle events,
 * running alongside `BillWriteItemPriceLotsSubscriber` (same event set,
 * same "only opened bills count" rule -- drafts carry no real VAT yet).
 */
@Injectable()
export class BillWriteVatRecordSubscriber {
  constructor(
    private readonly recordBillVatFromBill: RecordBillVatFromBillService,
  ) {}

  /**
   * Records the bill's VAT once it's created or opened.
   * @param {IBillCreatedPayload | IBillOpenedPayload} payload -
   */
  @OnEvent(events.bill.onCreated)
  @OnEvent(events.bill.onOpened)
  public async handleRecordingVat({
    bill,
    trx,
  }: IBillCreatedPayload | IBillOpenedPayload) {
    if (!bill.openedAt) return;

    await this.recordBillVatFromBill.recordVatForBill(bill.id, trx);
  }

  /**
   * Re-records the bill's VAT once it's edited.
   * @param {IBillEditedPayload} payload -
   */
  @OnEvent(events.bill.onEdited)
  public async handleRerecordingVat({ bill, trx }: IBillEditedPayload) {
    if (!bill.openedAt) return;

    await this.recordBillVatFromBill.recordVatForBill(bill.id, trx);
  }

  /**
   * Removes the bill's VAT record once it's deleted.
   * @param {IBIllEventDeletedPayload} payload -
   */
  @OnEvent(events.bill.onDeleted)
  public async handleRevertingVat({ billId, trx }: IBIllEventDeletedPayload) {
    await this.recordBillVatFromBill.revertVatForBill(billId, trx);
  }
}
