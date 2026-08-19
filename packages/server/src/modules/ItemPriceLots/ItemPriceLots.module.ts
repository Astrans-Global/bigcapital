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
import { GenerateSaleInvoiceNumberService } from './GenerateSaleInvoiceNumber.service';
import { ItemsEntriesService } from '../Items/ItemsEntries.service';
import { ItemPriceLotStockService } from './ItemPriceLotStock.service';
import { ReceiptLotConsumeService } from './ReceiptLotConsume.service';
import { ReceiptLotConsumeSubscriber } from './subscribers/ReceiptLotConsumeSubscriber';
import { CreditNoteLotRestockService } from './CreditNoteLotRestock.service';
import { CreditNoteLotRestockSubscriber } from './subscribers/CreditNoteLotRestockSubscriber';
import { WarehouseTransferLotService } from './WarehouseTransferLot.service';
import { WarehouseTransferLotSubscriber } from './subscribers/WarehouseTransferLotSubscriber';

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
    GenerateSaleInvoiceNumberService,
    ItemsEntriesService,
    ItemPriceLotsApplication,
    ItemPriceLotStockService,
    ReceiptLotConsumeService,
    ReceiptLotConsumeSubscriber,
    CreditNoteLotRestockService,
    CreditNoteLotRestockSubscriber,
    WarehouseTransferLotService,
    WarehouseTransferLotSubscriber,
  ],
})
export class ItemPriceLotsModule {}
