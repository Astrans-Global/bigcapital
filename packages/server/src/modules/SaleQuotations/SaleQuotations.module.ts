import { Module } from '@nestjs/common';
import { TenancyModule } from '../Tenancy/Tenancy.module';
import { TenancyDatabaseModule } from '../Tenancy/TenancyDB/TenancyDB.module';
import { ItemsModule } from '../Items/Items.module';
import { BranchesModule } from '../Branches/Branches.module';
import { WarehousesModule } from '../Warehouses/Warehouses.module';
import { TaxRatesModule } from '../TaxRates/TaxRate.module';
import { ChromiumlyTenancyModule } from '../ChromiumlyTenancy/ChromiumlyTenancy.module';
import { SaleQuotationsController } from './SaleQuotations.controller';
import { SaleQuotationsApplication } from './SaleQuotations.application';
import { CreateSaleQuotation } from './commands/CreateSaleQuotation.service';
import { EditSaleQuotation } from './commands/EditSaleQuotation.service';
import { DeleteSaleQuotation } from './commands/DeleteSaleQuotation.service';
import { SaleQuotationIncrement } from './commands/SaleQuotationIncrement.service';
import { GetSaleQuotation } from './queries/GetSaleQuotation.service';
import { GetSaleQuotationsService } from './queries/GetSaleQuotations.service';
import { ExportStatutoryQuotationService } from './queries/ExportStatutoryQuotation.service';

@Module({
  imports: [
    TenancyModule,
    TenancyDatabaseModule,
    ItemsModule,
    BranchesModule,
    WarehousesModule,
    TaxRatesModule,
    ChromiumlyTenancyModule,
  ],
  controllers: [SaleQuotationsController],
  providers: [
    SaleQuotationsApplication,
    CreateSaleQuotation,
    EditSaleQuotation,
    DeleteSaleQuotation,
    SaleQuotationIncrement,
    GetSaleQuotation,
    GetSaleQuotationsService,
    ExportStatutoryQuotationService,
  ],
})
export class SaleQuotationsModule {}
