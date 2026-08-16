import { Inject, Injectable } from '@nestjs/common';
import { CustomerArea } from '../models/CustomerArea.model';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';

@Injectable()
export class GetCustomerAreaService {
  constructor(
    @Inject(CustomerArea.name)
    private readonly customerAreaModel: TenantModelProxy<typeof CustomerArea>,
  ) {}

  /**
   * Retrieves customer area by id.
   */
  public async getCustomerArea(customerAreaId: number) {
    const customerArea = await this.customerAreaModel()
      .query()
      .findById(customerAreaId)
      .throwIfNotFound();

    return customerArea;
  }
}
