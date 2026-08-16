import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { CustomerArea } from '@/modules/CustomerAreas/models/CustomerArea.model';
import { ServiceError } from '@/modules/Items/ServiceError';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { ERRORS } from '../constants';

@Injectable()
export class GenerateCustomerCodeService {
  constructor(
    @Inject(CustomerArea.name)
    private readonly customerAreaModel: TenantModelProxy<typeof CustomerArea>,
  ) {}

  /**
   * Generates the next customer code for the given area (e.g. "QQ-0001") and
   * atomically bumps the area's running sequence. Must run inside the same
   * transaction as the customer insert so the sequence can never be reused.
   * @param {Knex.Transaction} trx
   * @param {number} areaId
   * @returns {Promise<string>}
   */
  public async generateCode(
    trx: Knex.Transaction,
    areaId: number,
  ): Promise<string> {
    const area = await this.customerAreaModel()
      .query(trx)
      .findById(areaId)
      .forUpdate();

    if (!area) {
      throw new ServiceError(
        ERRORS.AREA_NOT_FOUND,
        'The selected area was not found.',
      );
    }
    if (!area.invoiceNumberCode) {
      throw new ServiceError(
        ERRORS.AREA_MISSING_INVOICE_CODE,
        'The selected area does not have an area code set up yet, so a customer code cannot be generated. Please set one on the area first.',
      );
    }
    const sequence = area.nextCustomerNumber || 1;
    const code = `${area.invoiceNumberCode}-${String(sequence).padStart(4, '0')}`;

    await this.customerAreaModel()
      .query(trx)
      .findById(areaId)
      .patch({ nextCustomerNumber: sequence + 1 } as any);

    return code;
  }
}
