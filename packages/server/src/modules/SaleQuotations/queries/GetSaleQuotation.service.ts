import { Inject, Injectable } from '@nestjs/common';
import { SaleQuotation } from '../models/SaleQuotation';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { ServiceError } from '@/modules/Items/ServiceError';
import { ERRORS } from '../constants';

@Injectable()
export class GetSaleQuotation {
  constructor(
    @Inject(SaleQuotation.name)
    private readonly saleQuotationModel: TenantModelProxy<typeof SaleQuotation>,
  ) {}

  public async getQuotation(quotationId: number) {
    const quotation = await this.saleQuotationModel()
      .query()
      .findById(quotationId)
      .withGraphFetched('entries.item')
      .withGraphFetched('entries.tax')
      .withGraphFetched('warehouse');

    if (!quotation) {
      throw new ServiceError(ERRORS.SALE_QUOTATION_NOT_FOUND);
    }
    return quotation;
  }
}
