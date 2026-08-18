import { Controller, Get, Headers, Query, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { ApiCommonHeaders } from '@/common/decorators/ApiCommonHeaders';
import { AcceptType } from '@/constants/accept-type';
import { GetWarehouseInventoryService } from './GetWarehouseInventory.service';
import { GetWarehouseInventoryQueryDto } from './dtos/GetWarehouseInventoryQuery.dto';

@Controller('reports/warehouse-inventory')
@ApiTags('Reports')
@ApiCommonHeaders()
export class WarehouseInventoryController {
  constructor(
    private readonly getWarehouseInventoryService: GetWarehouseInventoryService,
  ) {}

  @Get()
  @ApiOperation({
    summary:
      'Warehouse inventory report -- one row per item price-lot (real / reserved / invoiced / float, litres, value). See docs/ops/PHASE1.md ("Warehouse inventory").',
  })
  async getWarehouseInventory(
    @Query() filterDto: GetWarehouseInventoryQueryDto,
    @Res({ passthrough: true }) res: Response,
    @Headers('accept') acceptHeader: string,
  ) {
    const accept = acceptHeader || '';

    if (accept.includes(AcceptType.ApplicationXlsx)) {
      const buffer =
        await this.getWarehouseInventoryService.toXlsx(filterDto);
      res.setHeader(
        'Content-Disposition',
        'attachment; filename=warehouse_inventory.xlsx',
      );
      res.setHeader('Content-Type', AcceptType.ApplicationXlsx);
      res.send(buffer);
      return;
    }

    return this.getWarehouseInventoryService.getInventory(filterDto);
  }
}
