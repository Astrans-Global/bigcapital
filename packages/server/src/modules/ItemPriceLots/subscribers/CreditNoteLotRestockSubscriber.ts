import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { events } from '@/common/events/events';
import {
  ICreditNoteCreatedPayload,
  ICreditNoteDeletingPayload,
  ICreditNoteEditedPayload,
  ICreditNoteEditingPayload,
  ICreditNoteOpenedPayload,
} from '../../CreditNotes/types/CreditNotes.types';
import { CreditNoteLotRestockService } from '../CreditNoteLotRestock.service';

/**
 * Restocks the picked item price lot when a credit note is opened (or
 * created already-open). Draft credit notes do not touch lots.
 */
@Injectable()
export class CreditNoteLotRestockSubscriber {
  constructor(private readonly restockService: CreditNoteLotRestockService) {}

  @OnEvent(events.creditNote.onCreated)
  @OnEvent(events.creditNote.onOpened)
  public async handleRestockOnCreateOrOpen({
    creditNote,
    trx,
  }: ICreditNoteCreatedPayload | ICreditNoteOpenedPayload) {
    if (!creditNote.isOpen && !creditNote.openedAt) return;
    await this.restockService.restockForCreditNote(creditNote.id, trx);
  }

  @OnEvent(events.creditNote.onEditing)
  public async handleUnrestockBeforeEdit({
    oldCreditNote,
    trx,
  }: ICreditNoteEditingPayload) {
    if (!oldCreditNote.isOpen && !oldCreditNote.openedAt) return;
    await this.restockService.unreStockForCreditNote(oldCreditNote.id, trx);
  }

  @OnEvent(events.creditNote.onEdited)
  public async handleRestockAfterEdit({
    creditNote,
    trx,
  }: ICreditNoteEditedPayload) {
    if (!creditNote.isOpen && !creditNote.openedAt) return;
    await this.restockService.restockForCreditNote(creditNote.id, trx);
  }

  @OnEvent(events.creditNote.onDeleting)
  public async handleUnrestockOnDelete({
    oldCreditNote,
    trx,
  }: ICreditNoteDeletingPayload) {
    if (!oldCreditNote.isOpen && !oldCreditNote.openedAt) return;
    await this.restockService.unreStockForCreditNote(oldCreditNote.id, trx);
  }
}
