import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Knex } from 'knex';
import { events } from '@/common/events/events';
import { UnitOfWork } from '@/modules/Tenancy/TenancyDB/UnitOfWork.service';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { TenancyContext } from '@/modules/Tenancy/TenancyContext.service';
import { SalesAgent } from '../models/SalesAgent.model';
import { CommandSalesAgentValidatorService } from './CommandSalesAgentValidator.service';
import { SalesAgentCashAccountService } from './SalesAgentCashAccount.service';
import { CreateSalesAgentDto } from '../dtos/SalesAgent.dto';
import { ISalesAgentCreatedPayload } from '../SalesAgent.interfaces';

@Injectable()
export class CreateSalesAgentService {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly validator: CommandSalesAgentValidatorService,
    private readonly cashAccountService: SalesAgentCashAccountService,
    private readonly eventEmitter: EventEmitter2,
    private readonly tenancyContext: TenancyContext,

    @Inject(SalesAgent.name)
    private readonly salesAgentModel: TenantModelProxy<typeof SalesAgent>,
  ) {}

  public async newSalesAgent(
    agentDTO: CreateSalesAgentDto,
    trx?: Knex.Transaction,
  ): Promise<SalesAgent> {
    await this.validator.validateNameUniquiness(agentDTO.name);
    const authorizedUser = await this.tenancyContext.getSystemUser();

    return this.uow.withTransaction(async (trx: Knex.Transaction) => {
      const inserted = await this.salesAgentModel()
        .query(trx)
        .insertAndFetch({
          name: agentDTO.name,
          active: agentDTO.active ?? true,
          userId: authorizedUser?.id,
        });

      const cashAccount = await this.cashAccountService.createCashAccount(
        inserted.id,
        inserted.name,
        trx,
      );

      const salesAgent = await this.salesAgentModel()
        .query(trx)
        .patchAndFetchById(inserted.id, { cashAccountId: cashAccount.id });

      await this.eventEmitter.emitAsync(events.salesAgent.onCreated, {
        salesAgent,
        trx,
      } as ISalesAgentCreatedPayload);

      return salesAgent;
    }, trx);
  }
}
