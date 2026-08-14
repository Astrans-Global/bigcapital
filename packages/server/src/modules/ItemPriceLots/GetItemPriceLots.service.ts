import { Inject, Injectable } from '@nestjs/common';
import { ItemPriceLot } from './models/ItemPriceLot.model';
import { ItemPriceLotReservation } from './models/ItemPriceLotReservation.model';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { GetItemPriceLotsQueryDto } from './dtos/GetItemPriceLotsQuery.dto';

@Injectable()
export class GetItemPriceLotsService {
  constructor(
    @Inject(ItemPriceLot.name)
    private readonly itemPriceLotModel: TenantModelProxy<typeof ItemPriceLot>,

    @Inject(ItemPriceLotReservation.name)
    private readonly reservationModel: TenantModelProxy<
      typeof ItemPriceLotReservation
    >,
  ) {}

  /**
   * Retrieves item price-lots, optionally filtered by item/warehouse.
   * Ordered oldest-first, since that's the natural default a user would
   * expect to see when picking which purchase batch to bill from.
   * @param {GetItemPriceLotsQueryDto} filterDto -
   */
  public async getItemPriceLots(filterDto: GetItemPriceLotsQueryDto) {
    const lots = await this.itemPriceLotModel()
      .query()
      .onBuild((query) => {
        if (filterDto?.itemId) {
          query.where('item_id', filterDto.itemId);
        }
        if (filterDto?.warehouseId) {
          query.where('warehouse_id', filterDto.warehouseId);
        }
        query.orderBy('created_at', 'asc');
      });

    if (filterDto?.excludeInvoiceId) {
      await this.excludeInvoiceOwnHold(lots, filterDto.excludeInvoiceId);
    }

    return lots;
  }

  /**
   * When re-opening an invoice that already holds stock aside (Reserved/
   * Invoiced), its own hold shouldn't count against what it can pick --
   * otherwise the picker would look more constrained than it really is.
   * Adjusts `reservedQty` on the in-memory instances only (not persisted)
   * so each lot's `floatQty` virtual comes out as "available to this
   * invoice", not "available to a brand new one".
   */
  private async excludeInvoiceOwnHold(
    lots: ItemPriceLot[],
    invoiceId: number,
  ): Promise<void> {
    if (lots.length === 0) return;

    const reservations = await this.reservationModel()
      .query()
      .where('sourceInvoiceId', invoiceId)
      .whereNull('consumedAt')
      .whereIn(
        'lotId',
        lots.map((lot) => lot.id),
      );

    const ownQtyByLotId = new Map<number, number>();
    for (const reservation of reservations) {
      ownQtyByLotId.set(
        reservation.lotId,
        (ownQtyByLotId.get(reservation.lotId) ?? 0) + reservation.qty,
      );
    }

    for (const lot of lots) {
      const ownQty = ownQtyByLotId.get(lot.id);
      if (ownQty) {
        lot.reservedQty -= ownQty;
      }
    }
  }
}
