import { Response } from 'express';
import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { SaleQuotationsApplication } from './SaleQuotations.application';
import {
  CreateSaleQuotationDto,
  EditSaleQuotationDto,
} from './dtos/SaleQuotation.dto';
import { AcceptType } from '@/constants/accept-type';
import { ApiCommonHeaders } from '@/common/decorators/ApiCommonHeaders';
import { AuthorizationGuard } from '@/modules/Roles/Authorization.guard';
import { PermissionGuard } from '@/modules/Roles/Permission.guard';
import { RequirePermission } from '@/modules/Roles/RequirePermission.decorator';
import { AbilitySubject } from '@/modules/Roles/Roles.types';
import { SaleEstimateAction } from '@/modules/SaleEstimates/types/SaleEstimates.types';

@Controller('sale-quotations')
@ApiTags('Sale Quotations')
@ApiCommonHeaders()
@UseGuards(AuthorizationGuard, PermissionGuard)
export class SaleQuotationsController {
  constructor(
    private readonly saleQuotationsApplication: SaleQuotationsApplication,
  ) {}

  @Post()
  @RequirePermission(SaleEstimateAction.Create, AbilitySubject.SaleEstimate)
  @ApiOperation({ summary: 'Create a quotation (no GL, no stock).' })
  createSaleQuotation(@Body() dto: CreateSaleQuotationDto) {
    return this.saleQuotationsApplication.createQuotation(dto);
  }

  @Get()
  @RequirePermission(SaleEstimateAction.View, AbilitySubject.SaleEstimate)
  @ApiOperation({ summary: 'List quotations.' })
  getSaleQuotations(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.saleQuotationsApplication.getQuotations(
      page ? Number(page) : 1,
      pageSize ? Number(pageSize) : 50,
    );
  }

  @Get(':id/statutory-invoice')
  @RequirePermission(SaleEstimateAction.View, AbilitySubject.SaleEstimate)
  @ApiOperation({
    summary:
      'Download the Non-VAT quotation Excel/PDF. Always Non-VAT. Quantity is not printed.',
  })
  @ApiParam({ name: 'id', type: Number })
  async downloadStatutoryInvoice(
    @Param('id', ParseIntPipe) quotationId: number,
    @Headers('accept') acceptHeader: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const fileKind = acceptHeader?.includes(AcceptType.ApplicationPdf)
      ? 'pdf'
      : 'xlsx';
    const result =
      await this.saleQuotationsApplication.exportStatutoryQuotation(
        quotationId,
        fileKind,
      );

    res.set({
      'Content-Type': result.contentType,
      'Content-Disposition': `attachment; filename=${result.filename}`,
    });
    res.send(result.buffer);
  }

  @Get(':id')
  @RequirePermission(SaleEstimateAction.View, AbilitySubject.SaleEstimate)
  getSaleQuotation(@Param('id', ParseIntPipe) quotationId: number) {
    return this.saleQuotationsApplication.getQuotation(quotationId);
  }

  @Put(':id')
  @RequirePermission(SaleEstimateAction.Edit, AbilitySubject.SaleEstimate)
  editSaleQuotation(
    @Param('id', ParseIntPipe) quotationId: number,
    @Body() dto: EditSaleQuotationDto,
  ) {
    return this.saleQuotationsApplication.editQuotation(quotationId, dto);
  }

  @Delete(':id')
  @RequirePermission(SaleEstimateAction.Delete, AbilitySubject.SaleEstimate)
  deleteSaleQuotation(@Param('id', ParseIntPipe) quotationId: number) {
    return this.saleQuotationsApplication.deleteQuotation(quotationId);
  }
}
