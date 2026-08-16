import { Inject, Injectable } from '@nestjs/common';
import { CustomerRouteCity } from '../models/CustomerRouteCity.model';
import { CustomerArea } from '../../CustomerAreas/models/CustomerArea.model';
import { Customer } from '../../Customers/models/Customer';
import { ServiceError } from '@/modules/Items/ServiceError';
import { ERRORS } from '../constants';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';

@Injectable()
export class CommandCustomerRouteCityValidatorService {
  constructor(
    @Inject(CustomerRouteCity.name)
    private readonly customerRouteCityModel: TenantModelProxy<
      typeof CustomerRouteCity
    >,

    @Inject(CustomerArea.name)
    private readonly customerAreaModel: TenantModelProxy<typeof CustomerArea>,

    @Inject(Customer.name)
    private readonly customerModel: TenantModelProxy<typeof Customer>,
  ) {}

  /**
   * Validates the route city name uniquiness within the given area.
   */
  public async validateNameUniquiness(
    name: string,
    areaId: number,
    notRouteCityId?: number,
  ) {
    const found = await this.customerRouteCityModel()
      .query()
      .findOne('name', name)
      .where('area_id', areaId)
      .onBuild((query) => {
        if (notRouteCityId) {
          query.whereNot('id', notRouteCityId);
        }
      });

    if (found) {
      throw new ServiceError(
        ERRORS.ROUTE_CITY_NAME_EXISTS,
        'The route city name already exists under this area.',
      );
    }
  }

  /**
   * Validates the parent area existance.
   */
  public async validateAreaExistance(areaId: number) {
    const found = await this.customerAreaModel().query().findById(areaId);

    if (!found) {
      throw new ServiceError(
        ERRORS.AREA_NOT_FOUND,
        'The parent area was not found.',
      );
    }
  }

  /**
   * Validates the route city existance.
   */
  public async validateRouteCityExistance(routeCityId: number) {
    const found = await this.customerRouteCityModel()
      .query()
      .findById(routeCityId);

    if (!found) {
      throw new ServiceError(
        ERRORS.ROUTE_CITY_NOT_FOUND,
        'The route city was not found.',
      );
    }
    return found;
  }

  /**
   * Validates the route city has no dependent customers before delete.
   */
  public async validateNoDependents(routeCityId: number) {
    const customersCount = await this.customerModel()
      .query()
      .where('route_city_id', routeCityId)
      .resultSize();

    if (customersCount > 0) {
      throw new ServiceError(
        ERRORS.ROUTE_CITY_HAS_CUSTOMERS,
        'Cannot delete a route city that still has customers assigned. Reassign them first.',
      );
    }
  }
}
