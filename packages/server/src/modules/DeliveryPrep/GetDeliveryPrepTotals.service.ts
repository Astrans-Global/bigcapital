import { Inject, Injectable } from '@nestjs/common';
import { ItemEntry } from '@/modules/TransactionItemEntry/models/ItemEntry';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';

export interface IDeliveryPrepTotalsItemRow {
  itemId: number;
  itemName: string;
  itemCode: string | null;
  totalQuantity: number;
  packSizeLitres: number | null;
  totalLitres: number | null;
}

export interface IDeliveryPrepTotalsResult {
  items: IDeliveryPrepTotalsItemRow[];
  totalLitres: number;
  invoiceCount: number;
}

const round3 = (value: number) =>
  Math.round((value + Number.EPSILON) * 1000) / 1000;

/**
 * Totals up quantity-per-item + litres across a ticked set of invoices for
 * the "Delivery Prep" screen -- see docs/ops/PHASE1.md ("Delivery Prep").
 * Litres = quantity x the item's `packSizeLitres` (only for items that have
 * one set; other items still count towards quantity, just not litres).
 */
@Injectable()
export class GetDeliveryPrepTotalsService {
  constructor(
    @Inject(ItemEntry.name)
    private readonly itemEntryModel: TenantModelProxy<typeof ItemEntry>,
  ) {}

  public async getTotals(
    invoiceIds: number[],
  ): Promise<IDeliveryPrepTotalsResult> {
    if (!invoiceIds?.length) {
      return { items: [], totalLitres: 0, invoiceCount: 0 };
    }
    const rows = await this.itemEntryModel()
      .query()
      .select(
        'items_entries.itemId',
        'items.name as itemName',
        'items.code as itemCode',
        'items.packSizeLitres',
      )
      .sum('items_entries.quantity as totalQuantity')
      .join('items', 'items.id', 'items_entries.itemId')
      .where('items_entries.referenceType', 'SaleInvoice')
      .whereIn('items_entries.referenceId', invoiceIds)
      .groupBy(
        'items_entries.itemId',
        'items.name',
        'items.code',
        'items.packSizeLitres',
      )
      .orderBy('items.name', 'asc');

    const items: IDeliveryPrepTotalsItemRow[] = (rows as any[]).map((row) => {
      const totalQuantity = Number(row.totalQuantity);
      const packSizeLitres =
        row.packSizeLitres != null ? Number(row.packSizeLitres) : null;
      const totalLitres =
        packSizeLitres != null
          ? round3(totalQuantity * packSizeLitres)
          : null;

      return {
        itemId: row.itemId,
        itemName: row.itemName,
        itemCode: row.itemCode ?? null,
        totalQuantity,
        packSizeLitres,
        totalLitres,
      };
    });

    const totalLitres = round3(
      items.reduce((sum, item) => sum + (item.totalLitres ?? 0), 0),
    );

    return { items, totalLitres, invoiceCount: invoiceIds.length };
  }
}
