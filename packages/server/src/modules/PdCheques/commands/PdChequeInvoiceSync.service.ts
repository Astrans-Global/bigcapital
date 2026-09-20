import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { SaleInvoice } from '@/modules/SaleInvoices/models/SaleInvoice';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { entriesAmountDiff } from '@/utils/entries-amount-diff';
import { PdChequeEntryDto } from '../dtos/PdCheque.dto';

@Injectable()
export class PdChequeInvoiceSync {
  constructor(
    @Inject(SaleInvoice.name)
    private readonly saleInvoiceModel: TenantModelProxy<typeof SaleInvoice>,
  ) {}

  public async saveChangeInvoicePaymentAmount(
    newEntries: PdChequeEntryDto[],
    oldEntries?: PdChequeEntryDto[],
    trx?: Knex.Transaction,
  ): Promise<void> {
    const opers: Promise<void>[] = [];
    const diffEntries = entriesAmountDiff(
      newEntries || [],
      oldEntries || [],
      'paymentAmount',
      'invoiceId',
    );
    diffEntries.forEach((diffEntry: any) => {
      if (diffEntry.paymentAmount === 0) {
        return;
      }
      opers.push(
        this.saleInvoiceModel().changePaymentAmount(
          diffEntry.invoiceId,
          diffEntry.paymentAmount,
          trx,
        ),
      );
    });
    await Promise.all(opers);
  }
}
