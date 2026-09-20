import { Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { CreateSalesAgentService } from './commands/CreateSalesAgent.service';
import { EditSalesAgentService } from './commands/EditSalesAgent.service';
import { DeleteSalesAgentService } from './commands/DeleteSalesAgent.service';
import { GetSalesAgentService } from './queries/GetSalesAgent.service';
import { GetSalesAgentsService } from './queries/GetSalesAgents.service';
import {
  CreateSalesAgentDto,
  EditSalesAgentDto,
} from './dtos/SalesAgent.dto';

@Injectable()
export class SalesAgentApplication {
  constructor(
    private readonly createSalesAgentService: CreateSalesAgentService,
    private readonly editSalesAgentService: EditSalesAgentService,
    private readonly deleteSalesAgentService: DeleteSalesAgentService,
    private readonly getSalesAgentService: GetSalesAgentService,
    private readonly getSalesAgentsService: GetSalesAgentsService,
  ) {}

  public createSalesAgent(agentDTO: CreateSalesAgentDto, trx?: Knex.Transaction) {
    return this.createSalesAgentService.newSalesAgent(agentDTO, trx);
  }

  public editSalesAgent(salesAgentId: number, agentDTO: EditSalesAgentDto) {
    return this.editSalesAgentService.editSalesAgent(salesAgentId, agentDTO);
  }

  public deleteSalesAgent(salesAgentId: number) {
    return this.deleteSalesAgentService.deleteSalesAgent(salesAgentId);
  }

  public getSalesAgent(salesAgentId: number) {
    return this.getSalesAgentService.getSalesAgent(salesAgentId);
  }

  public getSalesAgents() {
    return this.getSalesAgentsService.getSalesAgents();
  }
}
