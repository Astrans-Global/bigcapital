import { Knex } from 'knex';
import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { events } from '@/common/events/events';
import { UnitOfWork } from '@/modules/Tenancy/TenancyDB/UnitOfWork.service';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { CustomerRouteCity } from '../models/CustomerRouteCity.model';
import { CommandCustomerRouteCityValidatorService } from './CommandCustomerRouteCityValidator.service';
import { ICustomerRouteCityDeletedPayload } from '../CustomerRouteCity.interfaces';

@Injectable()
export class DeleteCustomerRouteCityService {
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
   * Deletes the given customer route city.
   */
  public async deleteCustomerRouteCity(
    customerRouteCityId: number,
    trx?: Knex.Transaction,
  ) {
    const oldCustomerRouteCity = await this.validator.validateRouteCityExistance(
      customerRouteCityId,
    );
    await this.validator.validateNoDependents(customerRouteCityId);

    return this.uow.withTransaction(async (trx: Knex.Transaction) => {
      await this.customerRouteCityModel()
        .query(trx)
        .findById(customerRouteCityId)
        .delete();

      await this.eventEmitter.emitAsync(events.customerRouteCity.onDeleted, {
        customerRouteCityId,
        oldCustomerRouteCity,
      } as ICustomerRouteCityDeletedPayload);
    }, trx);
  }
}
