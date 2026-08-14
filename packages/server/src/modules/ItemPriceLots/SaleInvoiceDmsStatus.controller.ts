import {
  Body,
  Controller,
  HttpCode,
  Param,
  ParseIntPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiCommonHeaders } from '@/common/decorators/ApiCommonHeaders';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '@/modules/Roles/RequirePermission.decorator';
import { PermissionGuard } from '@/modules/Roles/Permission.guard';
import { AuthorizationGuard } from '@/modules/Roles/Authorization.guard';
import { AbilitySubject } from '@/modules/Roles/Roles.types';
import { SaleInvoiceAction } from '../SaleInvoices/SaleInvoice.types';
import { InvoiceDmsStatusService } from './InvoiceDmsStatus.service';
import { SetInvoiceDmsStatusDto } from './dtos/SetInvoiceDmsStatus.dto';

/**
 * Astrans DMS invoice status pipeline endpoint -- deliberately a separate
 * controller (rather than added to `SaleInvoicesController`) to keep
 * Bigcapital's native sale-invoice module untouched. See
 * docs/ops/PHASE1.md ("Status pipeline").
 */
@Controller('sale-invoices')
@ApiTags('Sale Invoices')
@ApiCommonHeaders()
@UseGuards(AuthorizationGuard, PermissionGuard)
export class SaleInvoiceDmsStatusController {
  constructor(
    private readonly dmsStatusService: InvoiceDmsStatusService,
  ) {}

  @Put(':id/dms-status')
  @RequirePermission(SaleInvoiceAction.Edit, AbilitySubject.SaleInvoice)
  @ApiOperation({
    summary:
      'Moves the invoice through the Astrans DMS pipeline (Pending/Reserved/Invoiced/Delivered).',
  })
  @ApiParam({ name: 'id', required: true, type: Number })
  @ApiResponse({ status: 200, description: 'The invoice status was updated.' })
  @HttpCode(200)
  setDmsStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: SetInvoiceDmsStatusDto,
  ) {
    return this.dmsStatusService.setStatus(id, body.status);
  }
}
