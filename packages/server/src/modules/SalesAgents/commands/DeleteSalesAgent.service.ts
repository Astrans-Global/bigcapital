import { Knex } from 'knex';
import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { events } from '@/common/events/events';
import { UnitOfWork } from '@/modules/Tenancy/TenancyDB/UnitOfWork.service';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { SalesAgent } from '../models/SalesAgent.model';
import { CommandSalesAgentValidatorService } from './CommandSalesAgentValidator.service';
import { SalesAgentCashAccountService } from './SalesAgentCashAccount.service';
import { ISalesAgentDeletedPayload } from '../SalesAgent.interfaces';

@Injectable()
export class DeleteSalesAgentService {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly validator: CommandSalesAgentValidatorService,
    private readonly cashAccountService: SalesAgentCashAccountService,
    private readonly eventEmitter: EventEmitter2,

    @Inject(SalesAgent.name)
    private readonly salesAgentModel: TenantModelProxy<typeof SalesAgent>,
  ) {}

  public async deleteSalesAgent(salesAgentId: number, trx?: Knex.Transaction) {
    const oldSalesAgent = await this.validator.validateAgentExistance(
      salesAgentId,
    );
    await this.validator.validateNoPayments(salesAgentId);

    return this.uow.withTransaction(async (trx: Knex.Transaction) => {
      await this.salesAgentModel().query(trx).findById(salesAgentId).delete();

      if (oldSalesAgent.cashAccountId) {
        await this.cashAccountService.inactivateCashAccount(
          oldSalesAgent.cashAccountId,
          trx,
        );
      }

      await this.eventEmitter.emitAsync(events.salesAgent.onDeleted, {
        salesAgentId,
        oldSalesAgent,
      } as ISalesAgentDeletedPayload);
    }, trx);
  }
}
