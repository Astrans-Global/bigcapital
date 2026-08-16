import { Knex } from 'knex';
import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { events } from '@/common/events/events';
import { UnitOfWork } from '@/modules/Tenancy/TenancyDB/UnitOfWork.service';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { CustomerArea } from '../models/CustomerArea.model';
import { CommandCustomerAreaValidatorService } from './CommandCustomerAreaValidator.service';
import { ICustomerAreaDeletedPayload } from '../CustomerArea.interfaces';

@Injectable()
export class DeleteCustomerAreaService {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly validator: CommandCustomerAreaValidatorService,
    private readonly eventEmitter: EventEmitter2,

    @Inject(CustomerArea.name)
    private readonly customerAreaModel: TenantModelProxy<typeof CustomerArea>,
  ) {}

  /**
   * Deletes the given customer area.
   */
  public async deleteCustomerArea(
    customerAreaId: number,
    trx?: Knex.Transaction,
  ) {
    const oldCustomerArea = await this.validator.validateAreaExistance(
      customerAreaId,
    );
    await this.validator.validateNoDependents(customerAreaId);

    return this.uow.withTransaction(async (trx: Knex.Transaction) => {
      await this.customerAreaModel().query(trx).findById(customerAreaId).delete();

      await this.eventEmitter.emitAsync(events.customerArea.onDeleted, {
        customerAreaId,
        oldCustomerArea,
      } as ICustomerAreaDeletedPayload);
    }, trx);
  }
}
