import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Knex } from 'knex';
import { events } from '@/common/events/events';
import { UnitOfWork } from '@/modules/Tenancy/TenancyDB/UnitOfWork.service';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { SalesAgent } from '../models/SalesAgent.model';
import { CommandSalesAgentValidatorService } from './CommandSalesAgentValidator.service';
import { SalesAgentCashAccountService } from './SalesAgentCashAccount.service';
import { EditSalesAgentDto } from '../dtos/SalesAgent.dto';
import { ISalesAgentEditedPayload } from '../SalesAgent.interfaces';

@Injectable()
export class EditSalesAgentService {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly validator: CommandSalesAgentValidatorService,
    private readonly cashAccountService: SalesAgentCashAccountService,
    private readonly eventEmitter: EventEmitter2,

    @Inject(SalesAgent.name)
    private readonly salesAgentModel: TenantModelProxy<typeof SalesAgent>,
  ) {}

  public async editSalesAgent(
    salesAgentId: number,
    agentDTO: EditSalesAgentDto,
  ): Promise<SalesAgent> {
    const oldSalesAgent = await this.validator.validateAgentExistance(
      salesAgentId,
    );
    await this.validator.validateNameUniquiness(agentDTO.name, salesAgentId);

    return this.uow.withTransaction(async (trx: Knex.Transaction) => {
      const salesAgent = await this.salesAgentModel()
        .query(trx)
        .patchAndFetchById(salesAgentId, {
          name: agentDTO.name,
          active: agentDTO.active ?? oldSalesAgent.active,
        });

      if (oldSalesAgent.cashAccountId) {
        await this.cashAccountService.renameCashAccount(
          oldSalesAgent.cashAccountId,
          agentDTO.name,
          trx,
        );
      }

      await this.eventEmitter.emitAsync(events.salesAgent.onEdited, {
        oldSalesAgent,
        salesAgent,
        trx,
      } as ISalesAgentEditedPayload);

      return salesAgent;
    });
  }
}
