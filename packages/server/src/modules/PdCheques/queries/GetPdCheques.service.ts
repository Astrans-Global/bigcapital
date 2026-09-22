import { Inject, Injectable } from '@nestjs/common';
import * as xlsx from 'xlsx';
import { sumBy } from 'lodash';
import { PdCheque } from '../models/PdCheque.model';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { ChromiumlyTenancy } from '@/modules/ChromiumlyTenancy/ChromiumlyTenancy.service';
import { GetPdChequesQueryDto } from '../dtos/PdCheque.dto';

@Injectable()
export class GetPdChequesService {
  constructor(
    private readonly chromiumlyTenancy: ChromiumlyTenancy,

    @Inject(PdCheque.name)
    private readonly pdChequeModel: TenantModelProxy<typeof PdCheque>,
  ) {}

  public async getCheques(query: GetPdChequesQueryDto) {
    const statuses = this.parseStatuses(query.status);
    const rows = await this.pdChequeModel()
      .query()
      .withGraphFetched('[customer.area, customer.routeCity, entries.invoice]')
      .onBuild((builder) => {
        if (query.customerId) {
          builder.where('customerId', query.customerId);
        }
        if (statuses.length > 0) {
          builder.whereIn('status', statuses);
        }
        if (query.bankingDateFrom) {
          builder.where('bankingDate', '>=', query.bankingDateFrom);
        }
        if (query.bankingDateTo) {
          builder.where('bankingDate', '<=', query.bankingDateTo);
        }
        const chequeNo = String(query.chequeNo || '').trim();
        if (chequeNo) {
          builder.where('chequeNo', 'like', `%${chequeNo}%`);
        }
        const sortBy =
          query.sortBy === 'collectedDate' ? 'collectedDate' : 'bankingDate';
        builder.orderBy(sortBy, 'desc');
      });

    const filtered = query.areaId
      ? rows.filter(
          (row: any) => row.customer?.areaId === Number(query.areaId),
        )
      : rows;

    const mapped = filtered.map((cheque: any) => this.mapRow(cheque));
    return {
      rows: mapped,
      total: sumBy(mapped, 'amount'),
    };
  }

  public async toXlsx(query: GetPdChequesQueryDto) {
    const { rows, total } = await this.getCheques(query);
    const sheetRows = rows.map((row) => ({
      Customer: row.customerName,
      'Invoice numbers': row.invoiceNumbers,
      'Document no.': row.documentNo,
      'Cheque no.': row.chequeNo,
      'Collected date': row.collectedDate,
      'Banking date': row.bankingDate,
      Status: row.status,
      Amount: row.amount,
    }));
    sheetRows.push({
      Customer: 'Total',
      'Invoice numbers': '',
      'Document no.': '',
      'Cheque no.': '',
      'Collected date': '',
      'Banking date': '',
      Status: '',
      Amount: total,
    });
    const worksheet = xlsx.utils.json_to_sheet(sheetRows);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Cheques in hand');
    return xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }

  public async toPdf(query: GetPdChequesQueryDto) {
    const { rows, total } = await this.getCheques(query);
    const body = rows
      .map(
        (row) =>
          `<tr>
            <td>${this.esc(row.customerName)}</td>
            <td>${this.esc(row.invoiceNumbers)}</td>
            <td>${this.esc(row.documentNo)}</td>
            <td>${this.esc(row.chequeNo)}</td>
            <td>${this.esc(row.collectedDate)}</td>
            <td>${this.esc(row.bankingDate)}</td>
            <td>${this.esc(row.status)}</td>
            <td style="text-align:right">${Number(row.amount).toFixed(2)}</td>
          </tr>`,
      )
      .join('');
    const html = `<!doctype html>
      <html><head><style>
        body { font-family: Arial, sans-serif; font-size: 12px; }
        h1 { font-size: 16px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ccc; padding: 6px; }
        th { background: #f4f4f4; text-align: left; }
      </style></head>
      <body>
        <h1>Cheques in Hand</h1>
        <table>
          <thead>
            <tr>
              <th>Customer</th><th>Invoices</th><th>Document no.</th><th>Cheque no.</th>
              <th>Collected</th><th>Banking</th><th>Status</th><th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${body}
            <tr>
              <td colspan="7"><strong>Total</strong></td>
              <td style="text-align:right"><strong>${Number(total).toFixed(2)}</strong></td>
            </tr>
          </tbody>
        </table>
      </body></html>`;
    return this.chromiumlyTenancy.convertHtmlContent(html, { landscape: true });
  }

  private mapRow(cheque: any) {
    const invoiceNumbers = (cheque.entries || [])
      .map((entry: any) => {
        const no = entry.invoice?.invoiceNo;
        const amt = entry.paymentAmount;
        return no ? `${no} (${amt})` : '';
      })
      .filter(Boolean)
      .join(', ');

    return {
      id: cheque.id,
      customerId: cheque.customerId,
      customerName: cheque.customer?.displayName,
      areaName: cheque.customer?.area?.name,
      routeCityName: cheque.customer?.routeCity?.name,
      invoiceNumbers,
      documentNo: cheque.documentNo,
      chequeNo: cheque.chequeNo,
      amount: Number(cheque.amount),
      allocatedAmount: Number(cheque.allocatedAmount),
      advanceAmount: Number(cheque.advanceAmount),
      collectedDate: cheque.collectedDate,
      bankingDate: cheque.bankingDate,
      status: cheque.status,
      currencyCode: cheque.currencyCode,
      depositedBankId: cheque.depositedBankId,
      realizedBankId: cheque.realizedBankId,
    };
  }

  private parseStatuses(status?: string) {
    if (!status) {
      return [];
    }
    return status
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private esc(value: any) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}
