import { Module } from '@nestjs/common';
import { TenancyModule } from '../Tenancy/Tenancy.module';
import { RecordSaleInvoiceVatFromInvoiceService } from './RecordSaleInvoiceVatFromInvoice.service';
import { SaleInvoiceWriteVatRecordSubscriber } from './subscribers/SaleInvoiceWriteVatRecordSubscriber';

@Module({
  imports: [TenancyModule],
  providers: [
    RecordSaleInvoiceVatFromInvoiceService,
    SaleInvoiceWriteVatRecordSubscriber,
  ],
})
export class SaleInvoiceVatModule {}
