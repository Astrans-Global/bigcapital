import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { SaleInvoice } from '../SaleInvoices/models/SaleInvoice';
import { ItemPriceLot } from './models/ItemPriceLot.model';
import { ItemPriceLotReservation } from './models/ItemPriceLotReservation.model';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { ServiceError } from '@/modules/Items/ServiceError';
import { ERRORS } from './ItemPriceLots.constants';

/**
 * Holds/releases/consumes item price-lot stock for a sale invoice as it
 * moves through the Astrans DMS status pipeline (Pending -> Reserved ->
 * Invoiced -> Delivered) -- see docs/ops/PHASE1.md ("Status pipeline").
 *
 * Only invoice lines with an `itemPriceLotId` picked (the invoice-side
 * price-lot picker) participate; plain lines are left untouched.
 */
@Injectable()
export class InvoiceLotReservationService {
  constructor(
    @Inject(SaleInvoice.name)
    private readonly saleInvoiceModel: TenantModelProxy<typeof SaleInvoice>,

    @Inject(ItemPriceLot.name)
    private readonly itemPriceLotModel: TenantModelProxy<typeof ItemPriceLot>,

    @Inject(ItemPriceLotReservation.name)
    private readonly reservationModel: TenantModelProxy<
      typeof ItemPriceLotReservation
    >,
  ) {}

  /**
   * (Re-)holds stock for every lot-picked line of the invoice. Always
   * releases this invoice's own prior (unconsumed) reservations first, so
   * this is safe to call repeatedly as an invoice's lines/quantities
   * change -- it never double-counts its own earlier hold when checking
   * float quantity.
   * @param {number} invoiceId - Sale invoice id.
   * @param {Knex.Transaction} trx -
   * @throws {ServiceError} If any picked lot doesn't have enough float
   *   quantity (real - reserved, excluding this invoice's own prior hold).
   */
  public async reserveForInvoice(
    invoiceId: number,
    trx?: Knex.Transaction,
  ): Promise<void> {
    await this.releaseForInvoice(invoiceId, trx);

    const invoice = await this.saleInvoiceModel()
      .query(trx)
      .findById(invoiceId)
      .withGraphFetched('entries');

    if (!invoice) return;

    const lotEntries = (invoice.entries ?? []).filter(
      (entry) => entry.itemPriceLotId,
    );
    if (lotEntries.length === 0) return;

    // Multiple lines of the same lot on one invoice must be checked
    // together against that lot's float quantity, not one at a time.
    const qtyByLotId = new Map<number, number>();
    for (const entry of lotEntries) {
      qtyByLotId.set(
        entry.itemPriceLotId,
        (qtyByLotId.get(entry.itemPriceLotId) ?? 0) + entry.quantity,
      );
    }

    for (const [lotId, qtyNeeded] of qtyByLotId.entries()) {
      const lot = await this.itemPriceLotModel()
        .query(trx)
        .findById(lotId)
        .throwIfNotFound();

      const floatQty = lot.realQty - lot.reservedQty;

      if (qtyNeeded > floatQty) {
        throw new ServiceError(
          ERRORS.ITEM_PRICE_LOT_INSUFFICIENT_STOCK,
          `Item price-lot #${lotId} only has ${floatQty} available, ` +
            `but ${qtyNeeded} was requested.`,
          { lotId, floatQty, requestedQty: qtyNeeded },
        );
      }

      await this.itemPriceLotModel()
        .query(trx)
        .where('id', lotId)
        .increment('reservedQty', qtyNeeded);
    }

    for (const entry of lotEntries) {
      await this.reservationModel()
        .query(trx)
        .insert({
          lotId: entry.itemPriceLotId,
          sourceInvoiceId: invoiceId,
          sourceInvoiceEntryId: entry.id,
          qty: entry.quantity,
        } as Partial<ItemPriceLotReservation>);
    }
  }

  /**
   * Releases (deletes) every unconsumed reservation held by this invoice,
   * giving the quantity back to each lot's float balance. No-op for
   * reservations already consumed (invoice reached Delivered).
   * @param {number} invoiceId - Sale invoice id.
   * @param {Knex.Transaction} trx -
   */
  public async releaseForInvoice(
    invoiceId: number,
    trx?: Knex.Transaction,
  ): Promise<void> {
    const reservations = await this.reservationModel()
      .query(trx)
      .where('sourceInvoiceId', invoiceId)
      .whereNull('consumedAt');

    if (reservations.length === 0) return;

    const qtyByLotId = new Map<number, number>();
    for (const reservation of reservations) {
      qtyByLotId.set(
        reservation.lotId,
        (qtyByLotId.get(reservation.lotId) ?? 0) + reservation.qty,
      );
    }

    for (const [lotId, qty] of qtyByLotId.entries()) {
      await this.itemPriceLotModel()
        .query(trx)
        .where('id', lotId)
        .decrement('reservedQty', qty);
    }

    await this.reservationModel()
      .query(trx)
      .where('sourceInvoiceId', invoiceId)
      .whereNull('consumedAt')
      .delete();
  }

  /**
   * Converts this invoice's held reservations into a permanent stock
   * decrease -- called once the invoice reaches Delivered. Decrements
   * each lot's real quantity (and its matching reserved quantity, since
   * the hold is now resolved) and stamps the reservations as consumed
   * rather than deleting them, keeping an audit trail.
   * @param {number} invoiceId - Sale invoice id.
   * @param {Knex.Transaction} trx -
   */
  public async consumeForInvoice(
    invoiceId: number,
    trx?: Knex.Transaction,
  ): Promise<void> {
    const reservations = await this.reservationModel()
      .query(trx)
      .where('sourceInvoiceId', invoiceId)
      .whereNull('consumedAt');

    if (reservations.length === 0) return;

    const qtyByLotId = new Map<number, number>();
    for (const reservation of reservations) {
      qtyByLotId.set(
        reservation.lotId,
        (qtyByLotId.get(reservation.lotId) ?? 0) + reservation.qty,
      );
    }

    for (const [lotId, qty] of qtyByLotId.entries()) {
      await this.itemPriceLotModel()
        .query(trx)
        .where('id', lotId)
        .decrement('realQty', qty)
        .decrement('reservedQty', qty);
    }

    await this.reservationModel()
      .query(trx)
      .where('sourceInvoiceId', invoiceId)
      .whereNull('consumedAt')
      .patch({ consumedAt: new Date().toISOString() } as Partial<ItemPriceLotReservation>);
  }
}
