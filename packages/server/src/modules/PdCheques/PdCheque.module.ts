import { Module, forwardRef } from '@nestjs/common';
import { TenancyModule } from '../Tenancy/Tenancy.module';
import { TenancyDatabaseModule } from '../Tenancy/TenancyDB/TenancyDB.module';
import { LedgerModule } from '../Ledger/Ledger.module';
import { AccountsModule } from '../Accounts/Accounts.module';
import { ChromiumlyTenancyModule } from '../ChromiumlyTenancy/ChromiumlyTenancy.module';
import { PdChequeController } from './PdCheque.controller';
import { PdChequeApplication } from './PdCheque.application';
import { CreatePdChequeService } from './commands/CreatePdCheque.service';
import { EditPdChequeService } from './commands/EditPdCheque.service';
import { DeletePdChequeService } from './commands/DeletePdCheque.service';
import { PdChequeStatusService } from './commands/PdChequeStatus.service';
import { PdChequeGLService } from './commands/PdChequeGL.service';
import { PdChequeInvoiceSync } from './commands/PdChequeInvoiceSync.service';
import { GetPdChequesService } from './queries/GetPdCheques.service';
import { PdChequeIncrementService } from './commands/PdChequeIncrement.service';
import { AutoIncrementOrdersModule } from '../AutoIncrementOrders/AutoIncrementOrders.module';
import { BankReconciliationModule } from '../BankReconciliation/BankReconciliation.module';

@Module({
  imports: [
    TenancyModule,
    TenancyDatabaseModule,
    LedgerModule,
    AccountsModule,
    ChromiumlyTenancyModule,
    AutoIncrementOrdersModule,
    forwardRef(() => BankReconciliationModule),
  ],
  controllers: [PdChequeController],
  providers: [
    PdChequeApplication,
    CreatePdChequeService,
    EditPdChequeService,
    DeletePdChequeService,
    PdChequeStatusService,
    PdChequeGLService,
    PdChequeInvoiceSync,
    GetPdChequesService,
    PdChequeIncrementService,
  ],
  exports: [PdChequeApplication],
})
export class PdChequeModule {}
