import { Inject, Injectable } from '@nestjs/common';
import { CustomerArea } from '../models/CustomerArea.model';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { GetCustomerAreasResponse } from '../CustomerArea.interfaces';

@Injectable()
export class GetCustomerAreasService {
  constructor(
    @Inject(CustomerArea.name)
    private readonly customerAreaModel: TenantModelProxy<typeof CustomerArea>,
  ) {}

  /**
   * Retrieves the customer areas list.
   */
  public async getCustomerAreas(): Promise<GetCustomerAreasResponse> {
    const areas = await this.customerAreaModel()
      .query()
      .onBuild((query) => {
        query.orderBy('name', 'asc');
      });

    return areas;
  }
}
