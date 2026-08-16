import { Inject, Injectable } from '@nestjs/common';
import { ERRORS } from '../constants';
import { Customer } from '../models/Customer';
import { CustomerRouteCity } from '@/modules/CustomerRouteCities/models/CustomerRouteCity.model';
import { ServiceError } from '@/modules/Items/ServiceError';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';

@Injectable()
export class CustomerValidators {
  constructor(
    @Inject(CustomerRouteCity.name)
    private readonly customerRouteCityModel: TenantModelProxy<
      typeof CustomerRouteCity
    >,
  ) {}

  /**
   * Validates the given customer is not already published.
   * @param {ICustomer} customer
   */
  public validateNotAlreadyPublished = (customer: Customer) => {
    if (customer.active) {
      throw new ServiceError(ERRORS.CUSTOMER_ALREADY_ACTIVE);
    }
  };

  /**
   * Validates that the given route city actually belongs to the given area,
   * so a customer can't end up with mismatched Area/Route City.
   */
  public validateAreaRouteCityConsistency = async (
    areaId?: number,
    routeCityId?: number,
  ) => {
    if (!routeCityId) return;

    const routeCity = await this.customerRouteCityModel()
      .query()
      .findById(routeCityId);

    if (!routeCity) {
      throw new ServiceError(
        ERRORS.ROUTE_CITY_NOT_FOUND,
        'The selected route city was not found.',
      );
    }
    if (areaId && routeCity.areaId !== Number(areaId)) {
      throw new ServiceError(
        ERRORS.ROUTE_CITY_AREA_MISMATCH,
        'The selected route city does not belong to the selected area.',
      );
    }
  };
}
