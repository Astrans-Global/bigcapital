import { Module } from '@nestjs/common';
import { TenancyModule } from '../Tenancy/Tenancy.module';
import { SecondaryPnlController } from './SecondaryPnl.controller';
import { GetSecondaryPnlService } from './GetSecondaryPnl.service';
import { RecordSaleInvoiceLinePnlService } from './RecordSaleInvoiceLinePnl.service';
import { SaleInvoiceWriteLinePnlSubscriber } from './subscribers/SaleInvoiceWriteLinePnlSubscriber';

@Module({
  imports: [TenancyModule],
  controllers: [SecondaryPnlController],
  providers: [
    GetSecondaryPnlService,
    RecordSaleInvoiceLinePnlService,
    SaleInvoiceWriteLinePnlSubscriber,
  ],
})
export class SecondaryPnlModule {}
