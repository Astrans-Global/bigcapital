import { Module } from '@nestjs/common';
import { TenancyModule } from '../Tenancy/Tenancy.module';
import { TenancyDatabaseModule } from '../Tenancy/TenancyDB/TenancyDB.module';
import { BankReconciliationController } from './BankReconciliation.controller';
import { BankReconciliationApplication } from './BankReconciliation.application';
import { BankReconciliationQueryService } from './queries/BankReconciliationQuery.service';
import { LoadBankReconciliationLinesService } from './queries/LoadBankReconciliationLines.service';
import { GetBankReconciliationService } from './queries/GetBankReconciliation.service';
import { GetBankReconciliationsService } from './queries/GetBankReconciliations.service';
import { GetBankReconciliationEligibilityService } from './queries/GetBankReconciliationEligibility.service';
import { CreateBankReconciliationService } from './commands/CreateBankReconciliation.service';
import { SaveBankReconciliationDraftService } from './commands/SaveBankReconciliationDraft.service';
import { CloseBankReconciliationService } from './commands/CloseBankReconciliation.service';
import { ReopenBankReconciliationService } from './commands/ReopenBankReconciliation.service';
import { DeleteBankReconciliationService } from './commands/DeleteBankReconciliation.service';
import { BankReconciliationLockService } from './commands/BankReconciliationLock.service';
import { BankReconciliationSealsService } from './commands/BankReconciliationSeals.service';
import { BankReconciliationLockSubscriber } from './subscribers/BankReconciliationLockSubscriber';

@Module({
  imports: [TenancyModule, TenancyDatabaseModule],
  controllers: [BankReconciliationController],
  providers: [
    BankReconciliationApplication,
    BankReconciliationQueryService,
    LoadBankReconciliationLinesService,
    GetBankReconciliationService,
    GetBankReconciliationsService,
    GetBankReconciliationEligibilityService,
    CreateBankReconciliationService,
    SaveBankReconciliationDraftService,
    CloseBankReconciliationService,
    ReopenBankReconciliationService,
    DeleteBankReconciliationService,
    BankReconciliationLockService,
    BankReconciliationSealsService,
    BankReconciliationLockSubscriber,
  ],
  exports: [
    BankReconciliationApplication,
    BankReconciliationLockService,
    BankReconciliationSealsService,
  ],
})
export class BankReconciliationModule {}
