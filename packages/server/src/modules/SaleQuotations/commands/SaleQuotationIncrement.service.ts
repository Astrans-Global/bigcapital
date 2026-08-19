import { Injectable } from '@nestjs/common';
import { Knex } from 'knex';

@Injectable()
export class SaleQuotationIncrement {
  /**
   * Allocate the next QTN-0001 style number. Deleted numbers are never
   * reused — the stored counter only moves forward.
   */
  public async allocateNextNumber(trx: Knex.Transaction): Promise<string> {
    let row = await trx('settings')
      .where({ group: 'sales_quotations', key: 'next_number' })
      .forUpdate()
      .first();

    if (!row) {
      await trx('settings').insert({
        group: 'sales_quotations',
        key: 'next_number',
        value: '2',
      });
      return 'QTN-0001';
    }

    const n = parseInt(String(row.value), 10) || 1;
    await trx('settings').where({ id: row.id }).update({
      value: String(n + 1),
    });
    return `QTN-${String(n).padStart(4, '0')}`;
  }
}
