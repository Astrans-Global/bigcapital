import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiCommonHeaders } from '@/common/decorators/ApiCommonHeaders';
import { BankReconciliationApplication } from './BankReconciliation.application';
import {
  CreateBankReconciliationDto,
  GetBankRecEligibilityQueryDto,
  GetBankReconciliationsQueryDto,
  SaveBankReconciliationDraftDto,
} from './dtos/BankReconciliation.dto';

@Controller('banking/reconciliations')
@ApiTags('Bank Reconciliations')
@ApiCommonHeaders()
export class BankReconciliationController {
  constructor(private readonly application: BankReconciliationApplication) {}

  @Get()
  @ApiOperation({ summary: 'List bank reconciliations.' })
  list(@Query() query: GetBankReconciliationsQueryDto) {
    return this.application.list(query.accountId);
  }

  @Get('eligibility')
  @ApiOperation({ summary: 'Eligibility and defaults for a new Rec.' })
  eligibility(@Query() query: GetBankRecEligibilityQueryDto) {
    return this.application.eligibility(query.accountId, query.startDate);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a bank reconciliation worksheet.' })
  get(
    @Param('id', ParseIntPipe) id: number,
    @Query('hideAfterStatementDate') hideAfterStatementDate?: string,
  ) {
    const hide = hideAfterStatementDate !== 'false';
    return this.application.get(id, hide);
  }

  @Post()
  @ApiOperation({ summary: 'Create a draft Rec, or resume the existing draft.' })
  create(@Body() dto: CreateBankReconciliationDto) {
    return this.application.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Leave and save a draft Rec.' })
  save(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SaveBankReconciliationDraftDto,
  ) {
    return this.application.save(id, dto);
  }

  @Post(':id/close')
  @ApiOperation({ summary: 'Close a Rec when the difference is zero.' })
  close(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SaveBankReconciliationDraftDto,
  ) {
    return this.application.close(id, dto);
  }

  @Post(':id/reopen')
  @ApiOperation({ summary: 'Reopen the last closed Rec for that bank.' })
  reopen(@Param('id', ParseIntPipe) id: number) {
    return this.application.reopen(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a draft Rec.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.application.delete(id);
  }
}
