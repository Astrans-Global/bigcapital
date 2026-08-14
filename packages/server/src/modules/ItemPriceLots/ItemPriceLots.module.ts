import { Module, forwardRef } from '@nestjs/common';
import { TenancyModule } from '../Tenancy/Tenancy.module';
import { SaleInvoicesModule } from '../SaleInvoices/SaleInvoices.module';
import { ItemPriceLotsController } from './ItemPriceLots.controller';
import { SaleInvoiceDmsStatusController } from './SaleInvoiceDmsStatus.controller';
import { ItemPriceLotsApplication } from './ItemPriceLots.application';
import { GetItemPriceLotsService } from './GetItemPriceLots.service';
import { RecordItemPriceLotsFromBillService } from './RecordItemPriceLotsFromBill.service';
import { BillWriteItemPriceLotsSubscriber } from './subscribers/BillWriteItemPriceLotsSubscriber';
import { InvoiceLotReservationSyncSubscriber } from './subscribers/InvoiceLotReservationSyncSubscriber';
import { InvoiceLotReservationService } from './InvoiceLotReservation.service';
import { InvoiceDmsStatusService } from './InvoiceDmsStatus.service';
import { ItemsEntriesService } from '../Items/ItemsEntries.service';

@Module({
  imports: [TenancyModule, forwardRef(() => SaleInvoicesModule)],
  controllers: [ItemPriceLotsController, SaleInvoiceDmsStatusController],
  providers: [
    GetItemPriceLotsService,
    RecordItemPriceLotsFromBillService,
    BillWriteItemPriceLotsSubscriber,
    InvoiceLotReservationSyncSubscriber,
    InvoiceLotReservationService,
    InvoiceDmsStatusService,
    ItemsEntriesService,
    ItemPriceLotsApplication,
  ],
})
export class ItemPriceLotsModule {}
