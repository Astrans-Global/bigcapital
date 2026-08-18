import { Module } from '@nestjs/common';
import { TenancyModule } from '../Tenancy/Tenancy.module';
import { WarehouseInventoryController } from './WarehouseInventory.controller';
import { GetWarehouseInventoryService } from './GetWarehouseInventory.service';

@Module({
  imports: [TenancyModule],
  controllers: [WarehouseInventoryController],
  providers: [GetWarehouseInventoryService],
})
export class WarehouseInventoryModule {}
