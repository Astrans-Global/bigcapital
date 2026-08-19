import { Inject, Injectable } from '@nestjs/common';
import { SaleQuotation } from '../models/SaleQuotation';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';

@Injectable()
export class GetSaleQuotationsService {
  constructor(
    @Inject(SaleQuotation.name)
    private readonly saleQuotationModel: TenantModelProxy<typeof SaleQuotation>,
  ) {}

  public async getQuotations(page = 1, pageSize = 50) {
    const result = await this.saleQuotationModel()
      .query()
      .orderBy('id', 'desc')
      .page(Math.max(page - 1, 0), pageSize);

    return {
      quotations: result.results,
      pagination: {
        total: result.total,
        page,
        pageSize,
      },
    };
  }
}
