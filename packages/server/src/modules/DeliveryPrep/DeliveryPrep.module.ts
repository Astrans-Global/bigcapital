import { Module } from '@nestjs/common';
import { TenancyModule } from '../Tenancy/Tenancy.module';
import { DeliveryPrepController } from './DeliveryPrep.controller';
import { GetDeliveryPrepInvoicesService } from './GetDeliveryPrepInvoices.service';
import { GetDeliveryPrepTotalsService } from './GetDeliveryPrepTotals.service';

@Module({
  imports: [TenancyModule],
  controllers: [DeliveryPrepController],
  providers: [GetDeliveryPrepInvoicesService, GetDeliveryPrepTotalsService],
})
export class DeliveryPrepModule {}
