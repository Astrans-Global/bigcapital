import { ItemEntryDto } from '@/modules/TransactionItemEntry/dto/ItemEntry.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';
import { IsOptional, ToNumber } from '@/common/decorators/Validators';
import { MAX_SALE_QUOTATION_LINES } from '../constants';

class SaleQuotationEntryDto extends ItemEntryDto {}

export class CommandSaleQuotationDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'Acme Traders' })
  companyName: string;

  @IsOptional()
  @IsString()
  addressTo?: string;

  @IsOptional()
  @IsString()
  addressLine1?: string;

  @IsOptional()
  @IsString()
  addressLine2?: string;

  @IsNotEmpty()
  @IsDateString()
  quotationDate: Date;

  @IsOptional()
  @IsString()
  quotationNumber?: string;

  @IsOptional()
  @ToNumber()
  @IsNumber()
  warehouseId?: number;

  @IsOptional()
  @ToNumber()
  @IsNumber()
  branchId?: number;

  @IsOptional()
  @ToNumber()
  @IsNumber()
  exchangeRate?: number;

  @IsOptional()
  @IsString()
  currencyCode?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_SALE_QUOTATION_LINES)
  @ValidateNested({ each: true })
  @Type(() => SaleQuotationEntryDto)
  entries: SaleQuotationEntryDto[];
}

export class CreateSaleQuotationDto extends CommandSaleQuotationDto {}
export class EditSaleQuotationDto extends CommandSaleQuotationDto {}
