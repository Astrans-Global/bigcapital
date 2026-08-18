import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiCommonHeaders } from '@/common/decorators/ApiCommonHeaders';
import { GetDeliveryPrepInvoicesService } from './GetDeliveryPrepInvoices.service';
import { GetDeliveryPrepTotalsService } from './GetDeliveryPrepTotals.service';
import { GetDeliveryPrepInvoicesQueryDto } from './dtos/GetDeliveryPrepInvoicesQuery.dto';
import { GetDeliveryPrepTotalsQueryDto } from './dtos/GetDeliveryPrepTotalsQuery.dto';

@Controller('delivery-prep')
@ApiTags('Delivery Prep')
@ApiCommonHeaders()
export class DeliveryPrepController {
  constructor(
    private readonly getInvoicesService: GetDeliveryPrepInvoicesService,
    private readonly getTotalsService: GetDeliveryPrepTotalsService,
  ) {}

  @Get('invoices')
  @ApiOperation({
    summary:
      'Delivery Prep invoice worklist -- filterable by warehouse/area/route city/status/date, see docs/ops/PHASE1.md ("Delivery Prep").',
  })
  async getInvoices(@Query() filterDto: GetDeliveryPrepInvoicesQueryDto) {
    return this.getInvoicesService.getInvoices(filterDto);
  }

  @Get('totals')
  @ApiOperation({
    summary:
      'Delivery Prep totals -- quantity per item + total litres for a ticked set of invoices, see docs/ops/PHASE1.md ("Delivery Prep").',
  })
  async getTotals(@Query() query: GetDeliveryPrepTotalsQueryDto) {
    return this.getTotalsService.getTotals(query.invoiceIds);
  }
}
