import {
  Controller,
  Get,
  Headers,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiCommonHeaders } from '@/common/decorators/ApiCommonHeaders';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AcceptType } from '@/constants/accept-type';
import { InvoiceAgingService } from './InvoiceAging.service';
import { InvoiceAgingQueryDto } from './InvoiceAgingQuery.dto';
import { RequirePermission } from '@/modules/Roles/RequirePermission.decorator';
import { PermissionGuard } from '@/modules/Roles/Permission.guard';
import { AuthorizationGuard } from '@/modules/Roles/Authorization.guard';
import { AbilitySubject } from '@/modules/Roles/Roles.types';
import { ReportsAction } from '../../types/Report.types';

async function sendAging(
  app: InvoiceAgingService,
  kind: 'outstanding' | 'rd',
  filter: InvoiceAgingQueryDto,
  acceptHeader: string,
  res: Response,
) {
  const accept = acceptHeader || '';
  if (accept.includes(AcceptType.ApplicationXlsx)) {
    const buffer = await app.xlsx(filter, kind);
    res.setHeader('Content-Disposition', 'attachment; filename=output.xlsx');
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.send(buffer);
    return;
  }
  if (accept.includes(AcceptType.ApplicationCsv)) {
    const csv = await app.csv(filter, kind);
    res.setHeader('Content-Disposition', 'attachment; filename=output.csv');
    res.setHeader('Content-Type', 'text/csv');
    res.send(csv);
    return;
  }
  if (accept.includes(AcceptType.ApplicationPdf)) {
    const pdf = await app.pdf(filter, kind);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Length': pdf.length,
    });
    res.send(pdf);
    return;
  }
  return app.table(filter, kind);
}

@Controller('reports/outstanding-aging-summary')
@ApiTags('Reports')
@ApiCommonHeaders()
@UseGuards(AuthorizationGuard, PermissionGuard)
export class OutstandingAgingSummaryController {
  constructor(private readonly aging: InvoiceAgingService) {}

  @Get()
  @RequirePermission(ReportsAction.READ_AR_AGING_SUMMARY, AbilitySubject.Report)
  @ApiOperation({ summary: 'Outstanding aging summary (invoice-level).' })
  get(
    @Query() filter: InvoiceAgingQueryDto,
    @Res({ passthrough: true }) res: Response,
    @Headers('accept') acceptHeader: string,
  ) {
    return sendAging(this.aging, 'outstanding', filter, acceptHeader, res);
  }
}

@Controller('reports/rd-outstanding-aging-summary')
@ApiTags('Reports')
@ApiCommonHeaders()
@UseGuards(AuthorizationGuard, PermissionGuard)
export class RdOutstandingAgingSummaryController {
  constructor(private readonly aging: InvoiceAgingService) {}

  @Get()
  @RequirePermission(ReportsAction.READ_AR_AGING_SUMMARY, AbilitySubject.Report)
  @ApiOperation({ summary: 'RD outstanding aging summary (invoice-level).' })
  get(
    @Query() filter: InvoiceAgingQueryDto,
    @Res({ passthrough: true }) res: Response,
    @Headers('accept') acceptHeader: string,
  ) {
    return sendAging(this.aging, 'rd', filter, acceptHeader, res);
  }
}
