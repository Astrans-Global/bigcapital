import { Inject, Injectable } from '@nestjs/common';
import { CustomerRouteCity } from '../models/CustomerRouteCity.model';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';

@Injectable()
export class GetCustomerRouteCityService {
  constructor(
    @Inject(CustomerRouteCity.name)
    private readonly customerRouteCityModel: TenantModelProxy<
      typeof CustomerRouteCity
    >,
  ) {}

  /**
   * Retrieves customer route city by id.
   */
  public async getCustomerRouteCity(customerRouteCityId: number) {
    const customerRouteCity = await this.customerRouteCityModel()
      .query()
      .findById(customerRouteCityId)
      .throwIfNotFound();

    return customerRouteCity;
  }
}
