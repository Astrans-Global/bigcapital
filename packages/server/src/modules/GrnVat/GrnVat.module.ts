import { Module } from '@nestjs/common';
import { TenancyModule } from '../Tenancy/Tenancy.module';
import { RecordBillVatFromBillService } from './RecordBillVatFromBill.service';
import { BillWriteVatRecordSubscriber } from './subscribers/BillWriteVatRecordSubscriber';

@Module({
  imports: [TenancyModule],
  providers: [RecordBillVatFromBillService, BillWriteVatRecordSubscriber],
})
export class GrnVatModule {}
