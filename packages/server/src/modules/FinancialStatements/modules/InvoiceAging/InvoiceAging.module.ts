import { Module } from '@nestjs/common';
import { TenancyModule } from '@/modules/Tenancy/Tenancy.module';
import { FinancialSheetCommonModule } from '../../common/FinancialSheetCommon.module';
import { InvoiceAgingRepository } from './InvoiceAgingRepository';
import { InvoiceAgingService } from './InvoiceAging.service';
import {
  OutstandingAgingSummaryController,
  RdOutstandingAgingSummaryController,
} from './InvoiceAging.controller';

@Module({
  imports: [TenancyModule, FinancialSheetCommonModule],
  controllers: [
    OutstandingAgingSummaryController,
    RdOutstandingAgingSummaryController,
  ],
  providers: [InvoiceAgingRepository, InvoiceAgingService],
})
export class InvoiceAgingModule {}
