import { Inject, Injectable } from '@nestjs/common';
import { SalesAgent } from '../models/SalesAgent.model';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';

@Injectable()
export class GetSalesAgentService {
  constructor(
    @Inject(SalesAgent.name)
    private readonly salesAgentModel: TenantModelProxy<typeof SalesAgent>,
  ) {}

  public async getSalesAgent(salesAgentId: number) {
    return this.salesAgentModel()
      .query()
      .findById(salesAgentId)
      .withGraphFetched('cashAccount')
      .throwIfNotFound();
  }
}
