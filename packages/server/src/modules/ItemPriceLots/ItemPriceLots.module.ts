import { Module } from '@nestjs/common';
import { TenancyModule } from '../Tenancy/Tenancy.module';
import { ItemPriceLotsController } from './ItemPriceLots.controller';
import { ItemPriceLotsApplication } from './ItemPriceLots.application';
import { GetItemPriceLotsService } from './GetItemPriceLots.service';
import { RecordItemPriceLotsFromBillService } from './RecordItemPriceLotsFromBill.service';
import { BillWriteItemPriceLotsSubscriber } from './subscribers/BillWriteItemPriceLotsSubscriber';
import { ItemsEntriesService } from '../Items/ItemsEntries.service';

@Module({
  imports: [TenancyModule],
  controllers: [ItemPriceLotsController],
  providers: [
    GetItemPriceLotsService,
    RecordItemPriceLotsFromBillService,
    BillWriteItemPriceLotsSubscriber,
    ItemsEntriesService,
    ItemPriceLotsApplication,
  ],
})
export class ItemPriceLotsModule {}
