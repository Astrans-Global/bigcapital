import { Inject, Injectable } from '@nestjs/common';
import * as xlsx from 'xlsx';
import { ItemPriceLot } from '../ItemPriceLots/models/ItemPriceLot.model';
import { ItemPriceLotReservation } from '../ItemPriceLots/models/ItemPriceLotReservation.model';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { GetWarehouseInventoryQueryDto } from './dtos/GetWarehouseInventoryQuery.dto';

export interface IWarehouseInventoryRow {
  lotId: number;
  itemId: number;
  itemName: string;
  itemCode: string | null;
  warehouseId: number | null;
  warehouseName: string | null;
  listPriceExclVat: number;
  discountPercent: number;
  vatRatePercent: number;
  unitCostNet: number;
  realQty: number;
  reservedQty: number;
  invoicedQty: number;
  floatQty: number;
  packSizeLitres: number | null;
  litres: number | null;
  value: number;
}

export interface IWarehouseInventoryResult {
  rows: IWarehouseInventoryRow[];
  totalLitres: number;
  totalValue: number;
}

const round2 = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const round3 = (value: number) =>
  Math.round((value + Number.EPSILON) * 1000) / 1000;

const unitCostNet = (
  listPriceExclVat: number,
  discountPercent: number,
  vatRatePercent: number,
) => {
  const netExVat = listPriceExclVat * (1 - discountPercent / 100);
  const grossed = netExVat * (1 + vatRatePercent / 100);
  return round2(grossed);
};

/**
 * Warehouse inventory report -- one row per item price-lot, with real /
 * reserved / invoiced / float quantities, litres, and VAT-inclusive value.
 * See docs/ops/PHASE1.md ("Warehouse inventory").
 *
 * Reserved vs Invoiced are split from active `item_price_lot_reservations`
 * by the invoice's current DMS status. The lot's own `reserved_qty` column
 * already mixes both, so this report does not use that column for the
 * split (it is still what the oversell check uses). Report-only: no
 * stock or GL writes.
 */
@Injectable()
export class GetWarehouseInventoryService {
  constructor(
    @Inject(ItemPriceLot.name)
    private readonly itemPriceLotModel: TenantModelProxy<typeof ItemPriceLot>,

    @Inject(ItemPriceLotReservation.name)
    private readonly reservationModel: TenantModelProxy<
      typeof ItemPriceLotReservation
    >,
  ) {}

  public async getInventory(
    filterDto: GetWarehouseInventoryQueryDto,
  ): Promise<IWarehouseInventoryResult> {
    const lots = await this.itemPriceLotModel()
      .query()
      .select(
        'item_price_lots.id as lotId',
        'item_price_lots.itemId',
        'items.name as itemName',
        'items.code as itemCode',
        'items.packSizeLitres',
        'item_price_lots.warehouseId',
        'warehouses.name as warehouseName',
        'item_price_lots.listPriceExclVat',
        'item_price_lots.discountPercent',
        'item_price_lots.vatRatePercent',
        'item_price_lots.realQty',
      )
      .join('items', 'items.id', 'item_price_lots.itemId')
      .leftJoin('warehouses', 'warehouses.id', 'item_price_lots.warehouseId')
      .onBuild((query) => {
        if (filterDto?.warehouseId) {
          query.where('item_price_lots.warehouseId', filterDto.warehouseId);
        }
      })
      .orderBy('warehouses.name', 'asc')
      .orderBy('items.name', 'asc');

    const holds = await this.reservationModel()
      .query()
      .select(
        'item_price_lot_reservations.lotId',
        'sales_invoices.dmsStatus',
      )
      .sum('item_price_lot_reservations.qty as qty')
      .join(
        'sales_invoices',
        'sales_invoices.id',
        'item_price_lot_reservations.sourceInvoiceId',
      )
      .whereNull('item_price_lot_reservations.consumedAt')
      .whereIn('sales_invoices.dmsStatus', ['reserved', 'invoiced'])
      .groupBy(
        'item_price_lot_reservations.lotId',
        'sales_invoices.dmsStatus',
      );

    const reservedByLot = new Map<number, number>();
    const invoicedByLot = new Map<number, number>();
    for (const hold of holds as any[]) {
      const qty = Number(hold.qty) || 0;
      if (hold.dmsStatus === 'invoiced') {
        invoicedByLot.set(hold.lotId, qty);
      } else {
        reservedByLot.set(hold.lotId, qty);
      }
    }

    const includeInvoicedInFloat = Boolean(filterDto?.includeInvoicedInFloat);
    const hideZeroQty = Boolean(filterDto?.hideZeroQty);

    const rows: IWarehouseInventoryRow[] = [];
    for (const lot of lots as any[]) {
      const realQty = Number(lot.realQty) || 0;
      if (hideZeroQty && realQty === 0) {
        continue;
      }

      const reservedQty = reservedByLot.get(lot.lotId) ?? 0;
      const invoicedQty = invoicedByLot.get(lot.lotId) ?? 0;
      const floatQty = includeInvoicedInFloat
        ? realQty - reservedQty - invoicedQty
        : realQty - reservedQty;

      const cost = unitCostNet(
        Number(lot.listPriceExclVat) || 0,
        Number(lot.discountPercent) || 0,
        Number(lot.vatRatePercent) || 0,
      );
      const packSizeLitres =
        lot.packSizeLitres != null ? Number(lot.packSizeLitres) : null;
      const litres =
        packSizeLitres != null ? round3(realQty * packSizeLitres) : null;

      rows.push({
        lotId: lot.lotId,
        itemId: lot.itemId,
        itemName: lot.itemName,
        itemCode: lot.itemCode ?? null,
        warehouseId: lot.warehouseId ?? null,
        warehouseName: lot.warehouseName ?? null,
        listPriceExclVat: Number(lot.listPriceExclVat) || 0,
        discountPercent: Number(lot.discountPercent) || 0,
        vatRatePercent: Number(lot.vatRatePercent) || 0,
        unitCostNet: cost,
        realQty,
        reservedQty,
        invoicedQty,
        floatQty,
        packSizeLitres,
        litres,
        value: round2(cost * realQty),
      });
    }

    const totalLitres = round3(
      rows.reduce((sum, row) => sum + (row.litres ?? 0), 0),
    );
    const totalValue = round2(
      rows.reduce((sum, row) => sum + row.value, 0),
    );

    return { rows, totalLitres, totalValue };
  }

  public async toXlsx(
    filterDto: GetWarehouseInventoryQueryDto,
  ): Promise<Buffer> {
    const { rows, totalLitres, totalValue } =
      await this.getInventory(filterDto);

    const sheetRows = rows.map((row) => ({
      Warehouse: row.warehouseName || '',
      Item: row.itemName,
      Code: row.itemCode || '',
      'List price (excl. VAT)': row.listPriceExclVat,
      'Discount %': row.discountPercent,
      'VAT %': row.vatRatePercent,
      'Lot cost (incl. VAT)': row.unitCostNet,
      Real: row.realQty,
      Reserved: row.reservedQty,
      Invoiced: row.invoicedQty,
      Float: row.floatQty,
      Litres: row.litres ?? '',
      Value: row.value,
    }));

    sheetRows.push({
      Warehouse: '',
      Item: 'Totals',
      Code: '',
      'List price (excl. VAT)': '',
      'Discount %': '',
      'VAT %': '',
      'Lot cost (incl. VAT)': '',
      Real: '',
      Reserved: '',
      Invoiced: '',
      Float: '',
      Litres: totalLitres,
      Value: totalValue,
    } as any);

    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(sheetRows);
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Warehouse Inventory');

    return xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }
}
