import { Inject, Injectable } from '@nestjs/common';
import { SaleInvoiceLinePnl } from './models/SaleInvoiceLinePnl.model';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { GetSecondaryPnlQueryDto } from './dtos/GetSecondaryPnlQuery.dto';

export interface ISecondaryPnlRow {
  saleInvoiceId: number;
  invoiceNo: string | null;
  invoiceDate: string;
  warehouseId: number | null;
  warehouseName: string | null;
  customerId: number;
  customerName: string;
  areaId: number | null;
  areaName: string | null;
  invoicePnl: number;
}

export interface ISecondaryPnlResult {
  rows: ISecondaryPnlRow[];
  totalPnl: number;
}

const round2 = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

/**
 * Reads the Secondary P&L report: one row per Delivered invoice that has
 * at least one lot-picked line, filterable by warehouse / customer area /
 * invoice date range -- see docs/ops/PHASE1.md ("Secondary P&L").
 */
@Injectable()
export class GetSecondaryPnlService {
  constructor(
    @Inject(SaleInvoiceLinePnl.name)
    private readonly linePnlModel: TenantModelProxy<typeof SaleInvoiceLinePnl>,
  ) {}

  public async getSecondaryPnl(
    filterDto: GetSecondaryPnlQueryDto,
  ): Promise<ISecondaryPnlResult> {
    const rows = await this.linePnlModel()
      .query()
      .select(
        'sale_invoice_line_pnls.saleInvoiceId',
        'sales_invoices.invoiceNo',
        'sales_invoices.invoiceDate',
        'sales_invoices.warehouseId',
        'warehouses.name as warehouseName',
        'contacts.id as customerId',
        'contacts.displayName as customerName',
        'contacts.areaId',
        'customer_areas.name as areaName',
      )
      .sum('sale_invoice_line_pnls.linePnl as invoicePnl')
      .join(
        'sales_invoices',
        'sales_invoices.id',
        'sale_invoice_line_pnls.saleInvoiceId',
      )
      .join('contacts', 'contacts.id', 'sales_invoices.customerId')
      .leftJoin('customer_areas', 'customer_areas.id', 'contacts.areaId')
      .leftJoin('warehouses', 'warehouses.id', 'sales_invoices.warehouseId')
      .onBuild((query) => {
        if (filterDto?.warehouseId) {
          query.where('sales_invoices.warehouseId', filterDto.warehouseId);
        }
        if (filterDto?.areaId) {
          query.where('contacts.areaId', filterDto.areaId);
        }
        if (filterDto?.dateFrom) {
          query.where('sales_invoices.invoiceDate', '>=', filterDto.dateFrom);
        }
        if (filterDto?.dateTo) {
          query.where('sales_invoices.invoiceDate', '<=', filterDto.dateTo);
        }
      })
      .groupBy(
        'sale_invoice_line_pnls.saleInvoiceId',
        'sales_invoices.invoiceNo',
        'sales_invoices.invoiceDate',
        'sales_invoices.warehouseId',
        'warehouses.name',
        'contacts.id',
        'contacts.displayName',
        'contacts.areaId',
        'customer_areas.name',
      )
      .orderBy('sales_invoices.invoiceDate', 'desc');

    const mappedRows: ISecondaryPnlRow[] = rows.map((row: any) => ({
      saleInvoiceId: row.saleInvoiceId,
      invoiceNo: row.invoiceNo ?? null,
      invoiceDate: row.invoiceDate,
      warehouseId: row.warehouseId ?? null,
      warehouseName: row.warehouseName ?? null,
      customerId: row.customerId,
      customerName: row.customerName,
      areaId: row.areaId ?? null,
      areaName: row.areaName ?? null,
      invoicePnl: round2(Number(row.invoicePnl)),
    }));

    const totalPnl = round2(
      mappedRows.reduce((sum, row) => sum + row.invoicePnl, 0),
    );

    return { rows: mappedRows, totalPnl };
  }
}
