import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Knex } from 'knex';
import { events } from '@/common/events/events';
import { UnitOfWork } from '@/modules/Tenancy/TenancyDB/UnitOfWork.service';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { TenancyContext } from '@/modules/Tenancy/TenancyContext.service';
import { CustomerRouteCity } from '../models/CustomerRouteCity.model';
import { CommandCustomerRouteCityValidatorService } from './CommandCustomerRouteCityValidator.service';
import { CreateCustomerRouteCityDto } from '../dtos/CustomerRouteCity.dto';
import { ICustomerRouteCityCreatedPayload } from '../CustomerRouteCity.interfaces';

@Injectable()
export class CreateCustomerRouteCityService {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly validator: CommandCustomerRouteCityValidatorService,
    private readonly eventEmitter: EventEmitter2,
    private readonly tenancyContext: TenancyContext,

    @Inject(CustomerRouteCity.name)
    private readonly customerRouteCityModel: TenantModelProxy<
      typeof CustomerRouteCity
    >,
  ) {}

  /**
   * Inserts a new customer route city.
   */
  public async newCustomerRouteCity(
    routeCityDTO: CreateCustomerRouteCityDto,
    trx?: Knex.Transaction,
  ): Promise<CustomerRouteCity> {
    await this.validator.validateAreaExistance(routeCityDTO.areaId);
    await this.validator.validateNameUniquiness(
      routeCityDTO.name,
      routeCityDTO.areaId,
    );
    const authorizedUser = await this.tenancyContext.getSystemUser();

    return this.uow.withTransaction(async (trx: Knex.Transaction) => {
      const customerRouteCity = await this.customerRouteCityModel()
        .query(trx)
        .insertAndFetch({
          ...routeCityDTO,
          userId: authorizedUser?.id,
        });
      await this.eventEmitter.emitAsync(events.customerRouteCity.onCreated, {
        customerRouteCity,
        trx,
      } as ICustomerRouteCityCreatedPayload);

      return customerRouteCity;
    }, trx);
  }
}
