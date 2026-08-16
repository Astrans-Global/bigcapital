import { Inject, Injectable } from '@nestjs/common';
import { CustomerArea } from '../models/CustomerArea.model';
import { CustomerRouteCity } from '../../CustomerRouteCities/models/CustomerRouteCity.model';
import { Customer } from '../../Customers/models/Customer';
import { ServiceError } from '@/modules/Items/ServiceError';
import { ERRORS } from '../constants';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';

@Injectable()
export class CommandCustomerAreaValidatorService {
  constructor(
    @Inject(CustomerArea.name)
    private readonly customerAreaModel: TenantModelProxy<typeof CustomerArea>,

    @Inject(CustomerRouteCity.name)
    private readonly customerRouteCityModel: TenantModelProxy<
      typeof CustomerRouteCity
    >,

    @Inject(Customer.name)
    private readonly customerModel: TenantModelProxy<typeof Customer>,
  ) {}

  /**
   * Validates the area name uniquiness.
   */
  public async validateNameUniquiness(name: string, notAreaId?: number) {
    const found = await this.customerAreaModel()
      .query()
      .findOne('name', name)
      .onBuild((query) => {
        if (notAreaId) {
          query.whereNot('id', notAreaId);
        }
      });

    if (found) {
      throw new ServiceError(
        ERRORS.AREA_NAME_EXISTS,
        'The area name already exists.',
      );
    }
  }

  /**
   * Validates the invoice number code uniquiness.
   */
  public async validateCodeUniquiness(
    invoiceNumberCode: string | undefined,
    notAreaId?: number,
  ) {
    if (!invoiceNumberCode) return;

    const found = await this.customerAreaModel()
      .query()
      .findOne('invoice_number_code', invoiceNumberCode)
      .onBuild((query) => {
        if (notAreaId) {
          query.whereNot('id', notAreaId);
        }
      });

    if (found) {
      throw new ServiceError(
        ERRORS.AREA_CODE_EXISTS,
        'The invoice numbering code is already used by another area.',
      );
    }
  }

  /**
   * Validates the area existance.
   */
  public async validateAreaExistance(areaId: number) {
    const found = await this.customerAreaModel().query().findById(areaId);

    if (!found) {
      throw new ServiceError(ERRORS.AREA_NOT_FOUND, 'The area was not found.');
    }
    return found;
  }

  /**
   * Validates the area has no dependent route cities/customers before delete.
   */
  public async validateNoDependents(areaId: number) {
    const routeCitiesCount = await this.customerRouteCityModel()
      .query()
      .where('area_id', areaId)
      .resultSize();

    if (routeCitiesCount > 0) {
      throw new ServiceError(
        ERRORS.AREA_HAS_ROUTE_CITIES,
        'Cannot delete an area that still has route cities. Delete or move them first.',
      );
    }
    const customersCount = await this.customerModel()
      .query()
      .where('area_id', areaId)
      .resultSize();

    if (customersCount > 0) {
      throw new ServiceError(
        ERRORS.AREA_HAS_CUSTOMERS,
        'Cannot delete an area that still has customers assigned. Reassign them first.',
      );
    }
  }
}
