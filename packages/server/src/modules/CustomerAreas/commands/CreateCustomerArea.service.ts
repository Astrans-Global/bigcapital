import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Knex } from 'knex';
import { events } from '@/common/events/events';
import { UnitOfWork } from '@/modules/Tenancy/TenancyDB/UnitOfWork.service';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { TenancyContext } from '@/modules/Tenancy/TenancyContext.service';
import { CustomerArea } from '../models/CustomerArea.model';
import { CommandCustomerAreaValidatorService } from './CommandCustomerAreaValidator.service';
import { CreateCustomerAreaDto } from '../dtos/CustomerArea.dto';
import { ICustomerAreaCreatedPayload } from '../CustomerArea.interfaces';

@Injectable()
export class CreateCustomerAreaService {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly validator: CommandCustomerAreaValidatorService,
    private readonly eventEmitter: EventEmitter2,
    private readonly tenancyContext: TenancyContext,

    @Inject(CustomerArea.name)
    private readonly customerAreaModel: TenantModelProxy<typeof CustomerArea>,
  ) {}

  /**
   * Inserts a new customer area.
   */
  public async newCustomerArea(
    areaDTO: CreateCustomerAreaDto,
    trx?: Knex.Transaction,
  ): Promise<CustomerArea> {
    await this.validator.validateNameUniquiness(areaDTO.name);
    await this.validator.validateCodeUniquiness(areaDTO.invoiceNumberCode);

    const authorizedUser = await this.tenancyContext.getSystemUser();

    return this.uow.withTransaction(async (trx: Knex.Transaction) => {
      const customerArea = await this.customerAreaModel()
        .query(trx)
        .insertAndFetch({
          ...areaDTO,
          userId: authorizedUser?.id,
        });
      await this.eventEmitter.emitAsync(events.customerArea.onCreated, {
        customerArea,
        trx,
      } as ICustomerAreaCreatedPayload);

      return customerArea;
    }, trx);
  }
}
