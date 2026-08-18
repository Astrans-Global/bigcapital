import { Inject, Injectable } from '@nestjs/common';
import { SaleInvoice } from '../SaleInvoices/models/SaleInvoice';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { GetDeliveryPrepInvoicesQueryDto } from './dtos/GetDeliveryPrepInvoicesQuery.dto';

export interface IDeliveryPrepInvoiceRow {
  saleInvoiceId: number;
  invoiceNo: string | null;
  invoiceDate: string;
  dmsStatus: 'pending' | 'reserved' | 'invoiced' | 'delivered';
  warehouseId: number | null;
  warehouseName: string | null;
  customerId: number;
  customerName: string;
  areaId: number | null;
  areaName: string | null;
  routeCityId: number | null;
  routeCityName: string | null;
}

/**
 * Reads the invoice worklist for the "Delivery Prep" screen -- filterable
 * by warehouse / customer area / customer route city (tick-box, multiple) /
 * DMS status (tick-box, multiple) / invoice date range. See
 * docs/ops/PHASE1.md ("Delivery Prep"). Read-only, no GL/stock impact --
 * ticking invoices here is purely for building the totals below
 * (`GetDeliveryPrepTotalsService`), it doesn't change anything.
 */
@Injectable()
export class GetDeliveryPrepInvoicesService {
  constructor(
    @Inject(SaleInvoice.name)
    private readonly saleInvoiceModel: TenantModelProxy<typeof SaleInvoice>,
  ) {}

  public async getInvoices(
    filterDto: GetDeliveryPrepInvoicesQueryDto,
  ): Promise<IDeliveryPrepInvoiceRow[]> {
    const rows = await this.saleInvoiceModel()
      .query()
      .select(
        'sales_invoices.id as saleInvoiceId',
        'sales_invoices.invoiceNo',
        'sales_invoices.invoiceDate',
        'sales_invoices.dmsStatus',
        'sales_invoices.warehouseId',
        'warehouses.name as warehouseName',
        'contacts.id as customerId',
        'contacts.displayName as customerName',
        'contacts.areaId',
        'customer_areas.name as areaName',
        'contacts.routeCityId',
        'customer_route_cities.name as routeCityName',
      )
      .join('contacts', 'contacts.id', 'sales_invoices.customerId')
      .leftJoin('customer_areas', 'customer_areas.id', 'contacts.areaId')
      .leftJoin(
        'customer_route_cities',
        'customer_route_cities.id',
        'contacts.routeCityId',
      )
      .leftJoin('warehouses', 'warehouses.id', 'sales_invoices.warehouseId')
      .onBuild((query) => {
        if (filterDto?.warehouseId) {
          query.where('sales_invoices.warehouseId', filterDto.warehouseId);
        }
        if (filterDto?.areaId) {
          query.where('contacts.areaId', filterDto.areaId);
        }
        if (filterDto?.routeCityId?.length) {
          query.whereIn('contacts.routeCityId', filterDto.routeCityId);
        }
        if (filterDto?.dmsStatus?.length) {
          query.whereIn('sales_invoices.dmsStatus', filterDto.dmsStatus);
        }
        if (filterDto?.dateFrom) {
          query.where('sales_invoices.invoiceDate', '>=', filterDto.dateFrom);
        }
        if (filterDto?.dateTo) {
          query.where('sales_invoices.invoiceDate', '<=', filterDto.dateTo);
        }
      })
      .orderBy('sales_invoices.invoiceDate', 'desc');

    return (rows as any[]).map((row) => ({
      saleInvoiceId: row.saleInvoiceId,
      invoiceNo: row.invoiceNo ?? null,
      invoiceDate: row.invoiceDate,
      dmsStatus: row.dmsStatus ?? 'pending',
      warehouseId: row.warehouseId ?? null,
      warehouseName: row.warehouseName ?? null,
      customerId: row.customerId,
      customerName: row.customerName,
      areaId: row.areaId ?? null,
      areaName: row.areaName ?? null,
      routeCityId: row.routeCityId ?? null,
      routeCityName: row.routeCityName ?? null,
    }));
  }
}
