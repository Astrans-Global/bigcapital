import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Knex } from 'knex';
import { events } from '@/common/events/events';
import { UnitOfWork } from '@/modules/Tenancy/TenancyDB/UnitOfWork.service';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { CustomerArea } from '../models/CustomerArea.model';
import { CommandCustomerAreaValidatorService } from './CommandCustomerAreaValidator.service';
import { EditCustomerAreaDto } from '../dtos/CustomerArea.dto';
import { ICustomerAreaEditedPayload } from '../CustomerArea.interfaces';

@Injectable()
export class EditCustomerAreaService {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly validator: CommandCustomerAreaValidatorService,
    private readonly eventEmitter: EventEmitter2,

    @Inject(CustomerArea.name)
    private readonly customerAreaModel: TenantModelProxy<typeof CustomerArea>,
  ) {}

  /**
   * Edits the given customer area.
   */
  public async editCustomerArea(
    customerAreaId: number,
    areaDTO: EditCustomerAreaDto,
  ): Promise<CustomerArea> {
    const oldCustomerArea = await this.validator.validateAreaExistance(
      customerAreaId,
    );
    await this.validator.validateNameUniquiness(areaDTO.name, customerAreaId);
    await this.validator.validateCodeUniquiness(
      areaDTO.invoiceNumberCode,
      customerAreaId,
    );

    return this.uow.withTransaction(async (trx: Knex.Transaction) => {
      const customerArea = await this.customerAreaModel()
        .query(trx)
        .patchAndFetchById(customerAreaId, { ...areaDTO });

      await this.eventEmitter.emitAsync(events.customerArea.onEdited, {
        oldCustomerArea,
        customerArea,
        trx,
      } as ICustomerAreaEditedPayload);

      return customerArea;
    });
  }
}
