import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { events } from '@/common/events/events';
import {
  ISaleReceiptCreatedPayload,
  ISaleReceiptEditedPayload,
  ISaleReceiptEditingPayload,
  ISaleReceiptEventClosedPayload,
  ISaleReceiptDeletingPayload,
} from '../../SaleReceipts/types/SaleReceipts.types';
import { ReceiptLotConsumeService } from '../ReceiptLotConsume.service';

/**
 * Consumes (or restores) item price-lot stock when a sale receipt is
 * closed / edited-while-closed / deleted. Draft receipts do not hold stock.
 *
 * Restore-on-delete runs on `onDeleting` so the item_entries rows still
 * exist. Consume/restore-on-edit uses the current rows after upsertGraph.
 */
@Injectable()
export class ReceiptLotConsumeSubscriber {
  constructor(private readonly consumeService: ReceiptLotConsumeService) {}

  @OnEvent(events.saleReceipt.onCreated)
  @OnEvent(events.saleReceipt.onClosed)
  public async handleConsumeOnCreateOrClose({
    saleReceipt,
    saleReceiptId,
    trx,
  }: ISaleReceiptCreatedPayload | ISaleReceiptEventClosedPayload) {
    if (!saleReceipt.closedAt) return;
    await this.consumeService.consumeForReceipt(
      saleReceiptId ?? saleReceipt.id,
      trx,
    );
  }

  @OnEvent(events.saleReceipt.onEditing)
  public async handleRestoreBeforeEdit({
    oldSaleReceipt,
    trx,
  }: ISaleReceiptEditingPayload) {
    if (!oldSaleReceipt.closedAt) return;
    await this.consumeService.restoreForReceipt(oldSaleReceipt.id, trx);
  }

  @OnEvent(events.saleReceipt.onEdited)
  public async handleConsumeAfterEdit({
    saleReceipt,
    trx,
  }: ISaleReceiptEditedPayload) {
    if (!saleReceipt.closedAt) return;
    await this.consumeService.consumeForReceipt(saleReceipt.id, trx);
  }

  @OnEvent(events.saleReceipt.onDeleting)
  public async handleRestoreOnDelete({
    oldSaleReceipt,
    trx,
  }: ISaleReceiptDeletingPayload) {
    if (!oldSaleReceipt.closedAt) return;
    await this.consumeService.restoreForReceipt(oldSaleReceipt.id, trx);
  }
}
