import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Knex } from 'knex';
import { events } from '@/common/events/events';
import { UnitOfWork } from '@/modules/Tenancy/TenancyDB/UnitOfWork.service';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { CustomerRouteCity } from '../models/CustomerRouteCity.model';
import { CommandCustomerRouteCityValidatorService } from './CommandCustomerRouteCityValidator.service';
import { EditCustomerRouteCityDto } from '../dtos/CustomerRouteCity.dto';
import { ICustomerRouteCityEditedPayload } from '../CustomerRouteCity.interfaces';

@Injectable()
export class EditCustomerRouteCityService {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly validator: CommandCustomerRouteCityValidatorService,
    private readonly eventEmitter: EventEmitter2,

    @Inject(CustomerRouteCity.name)
    private readonly customerRouteCityModel: TenantModelProxy<
      typeof CustomerRouteCity
    >,
  ) {}

  /**
   * Edits the given customer route city.
   */
  public async editCustomerRouteCity(
    customerRouteCityId: number,
    routeCityDTO: EditCustomerRouteCityDto,
  ): Promise<CustomerRouteCity> {
    const oldCustomerRouteCity = await this.validator.validateRouteCityExistance(
      customerRouteCityId,
    );
    await this.validator.validateAreaExistance(routeCityDTO.areaId);
    await this.validator.validateNameUniquiness(
      routeCityDTO.name,
      routeCityDTO.areaId,
      customerRouteCityId,
    );
    return this.uow.withTransaction(async (trx: Knex.Transaction) => {
      const customerRouteCity = await this.customerRouteCityModel()
        .query(trx)
        .patchAndFetchById(customerRouteCityId, { ...routeCityDTO });

      await this.eventEmitter.emitAsync(events.customerRouteCity.onEdited, {
        oldCustomerRouteCity,
        customerRouteCity,
        trx,
      } as ICustomerRouteCityEditedPayload);

      return customerRouteCity;
    });
  }
}
