import { Inject, Injectable } from '@nestjs/common';
import { SalesAgent } from '../models/SalesAgent.model';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { GetSalesAgentsResponse } from '../SalesAgent.interfaces';

@Injectable()
export class GetSalesAgentsService {
  constructor(
    @Inject(SalesAgent.name)
    private readonly salesAgentModel: TenantModelProxy<typeof SalesAgent>,
  ) {}

  public async getSalesAgents(): Promise<GetSalesAgentsResponse> {
    return this.salesAgentModel()
      .query()
      .withGraphFetched('cashAccount')
      .orderBy('name', 'asc');
  }
}
