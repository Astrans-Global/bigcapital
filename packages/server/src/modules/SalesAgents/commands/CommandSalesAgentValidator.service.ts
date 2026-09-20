import { Inject, Injectable } from '@nestjs/common';
import { SalesAgent } from '../models/SalesAgent.model';
import { PaymentReceived } from '../../PaymentReceived/models/PaymentReceived';
import { ServiceError } from '@/modules/Items/ServiceError';
import { ERRORS } from '../constants';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';

@Injectable()
export class CommandSalesAgentValidatorService {
  constructor(
    @Inject(SalesAgent.name)
    private readonly salesAgentModel: TenantModelProxy<typeof SalesAgent>,

    @Inject(PaymentReceived.name)
    private readonly paymentReceivedModel: TenantModelProxy<
      typeof PaymentReceived
    >,
  ) {}

  public async validateNameUniquiness(name: string, notAgentId?: number) {
    const found = await this.salesAgentModel()
      .query()
      .findOne('name', name)
      .onBuild((query) => {
        if (notAgentId) {
          query.whereNot('id', notAgentId);
        }
      });

    if (found) {
      throw new ServiceError(
        ERRORS.AGENT_NAME_EXISTS,
        'The agent name already exists.',
      );
    }
  }

  public async validateAgentExistance(agentId: number) {
    const found = await this.salesAgentModel().query().findById(agentId);

    if (!found) {
      throw new ServiceError(ERRORS.AGENT_NOT_FOUND, 'The agent was not found.');
    }
    return found;
  }

  public async validateNoPayments(agentId: number) {
    const paymentsCount = await this.paymentReceivedModel()
      .query()
      .where('agent_id', agentId)
      .resultSize();

    if (paymentsCount > 0) {
      throw new ServiceError(
        ERRORS.AGENT_HAS_PAYMENTS,
        'Cannot delete an agent that still has cash collections. Inactivate them instead.',
      );
    }
  }
}
