import { Inject, Injectable } from '@nestjs/common';
import { CustomerRouteCity } from '../models/CustomerRouteCity.model';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { GetCustomerRouteCitiesQueryDto } from '../dtos/GetCustomerRouteCitiesQuery.dto';
import { GetCustomerRouteCitiesResponse } from '../CustomerRouteCity.interfaces';

@Injectable()
export class GetCustomerRouteCitiesService {
  constructor(
    @Inject(CustomerRouteCity.name)
    private readonly customerRouteCityModel: TenantModelProxy<
      typeof CustomerRouteCity
    >,
  ) {}

  /**
   * Retrieves the customer route cities list, optionally filtered by area.
   */
  public async getCustomerRouteCities(
    filterDto: GetCustomerRouteCitiesQueryDto,
  ): Promise<GetCustomerRouteCitiesResponse> {
    const routeCities = await this.customerRouteCityModel()
      .query()
      .onBuild((query) => {
        if (filterDto?.areaId) {
          query.where('area_id', filterDto.areaId);
        }
        query.orderBy('name', 'asc');
      });

    return routeCities;
  }
}
