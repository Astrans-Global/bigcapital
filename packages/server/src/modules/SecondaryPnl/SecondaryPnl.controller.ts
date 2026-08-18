import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiCommonHeaders } from '@/common/decorators/ApiCommonHeaders';
import { GetSecondaryPnlService } from './GetSecondaryPnl.service';
import { GetSecondaryPnlQueryDto } from './dtos/GetSecondaryPnlQuery.dto';

@Controller('reports/secondary-pnl')
@ApiTags('Reports')
@ApiCommonHeaders()
export class SecondaryPnlController {
  constructor(
    private readonly getSecondaryPnlService: GetSecondaryPnlService,
  ) {}

  @Get()
  @ApiOperation({
    summary:
      'Secondary P&L report -- lot cost vs. sell price variance per Delivered invoice, see docs/ops/PHASE1.md ("Secondary P&L").',
  })
  async getSecondaryPnl(@Query() filterDto: GetSecondaryPnlQueryDto) {
    return this.getSecondaryPnlService.getSecondaryPnl(filterDto);
  }
}
