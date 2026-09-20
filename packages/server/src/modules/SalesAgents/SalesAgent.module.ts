import { Module } from '@nestjs/common';
import { TenancyDatabaseModule } from '../Tenancy/TenancyDB/TenancyDB.module';
import { TenancyModule } from '../Tenancy/Tenancy.module';
import { SalesAgentController } from './SalesAgent.controller';
import { SalesAgentApplication } from './SalesAgent.application';
import { CreateSalesAgentService } from './commands/CreateSalesAgent.service';
import { EditSalesAgentService } from './commands/EditSalesAgent.service';
import { DeleteSalesAgentService } from './commands/DeleteSalesAgent.service';
import { CommandSalesAgentValidatorService } from './commands/CommandSalesAgentValidator.service';
import { SalesAgentCashAccountService } from './commands/SalesAgentCashAccount.service';
import { GetSalesAgentService } from './queries/GetSalesAgent.service';
import { GetSalesAgentsService } from './queries/GetSalesAgents.service';

@Module({
  imports: [TenancyModule, TenancyDatabaseModule],
  controllers: [SalesAgentController],
  providers: [
    CreateSalesAgentService,
    EditSalesAgentService,
    DeleteSalesAgentService,
    GetSalesAgentService,
    GetSalesAgentsService,
    CommandSalesAgentValidatorService,
    SalesAgentCashAccountService,
    SalesAgentApplication,
  ],
  exports: [SalesAgentApplication],
})
export class SalesAgentModule {}
