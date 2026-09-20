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
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiCommonHeaders } from '@/common/decorators/ApiCommonHeaders';
import { AcceptType } from '@/constants/accept-type';
import { PdChequeApplication } from './PdCheque.application';
import {
  CreatePdChequeDto,
  EditPdChequeDto,
  GetPdChequesQueryDto,
  PdChequeBankActionDto,
} from './dtos/PdCheque.dto';

@Controller('pd-cheques')
@ApiTags('PD Cheques')
@ApiCommonHeaders()
export class PdChequeController {
  constructor(private readonly application: PdChequeApplication) {}

  @Get()
  @ApiOperation({ summary: 'List post-dated cheques in hand.' })
  async getCheques(
    @Query() query: GetPdChequesQueryDto,
    @Headers('accept') acceptHeader: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (acceptHeader?.includes(AcceptType.ApplicationXlsx)) {
      const buffer = await this.application.toXlsx(query);
      res.set({
        'Content-Type': AcceptType.ApplicationXlsx,
        'Content-Disposition': 'attachment; filename="cheques-in-hand.xlsx"',
      });
      res.send(buffer);
      return;
    }
    if (acceptHeader?.includes(AcceptType.ApplicationPdf)) {
      const buffer = await this.application.toPdf(query);
      res.set({
        'Content-Type': AcceptType.ApplicationPdf,
        'Content-Disposition': 'attachment; filename="cheques-in-hand.pdf"',
      });
      res.send(buffer);
      return;
    }
    return this.application.getCheques(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create a post-dated cheque collection.' })
  create(@Body() dto: CreatePdChequeDto) {
    return this.application.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Edit a pending post-dated cheque.' })
  edit(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: EditPdChequeDto,
  ) {
    return this.application.edit(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a pending post-dated cheque.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.application.delete(id);
  }

  @Post(':id/deposit')
  @ApiOperation({ summary: 'Mark a cheque deposited (no GL).' })
  deposit(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: PdChequeBankActionDto,
  ) {
    return this.application.markDeposited(id, dto.bankAccountId);
  }

  @Post(':id/realize')
  @ApiOperation({ summary: 'Realize a cheque into a bank account.' })
  realize(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: PdChequeBankActionDto,
  ) {
    return this.application.markRealized(
      id,
      dto.bankAccountId,
      dto.realizeDate,
    );
  }

  @Post(':id/return')
  @ApiOperation({ summary: 'Return a cheque and restore invoices.' })
  markReturn(@Param('id', ParseIntPipe) id: number) {
    return this.application.markReturned(id);
  }
}
