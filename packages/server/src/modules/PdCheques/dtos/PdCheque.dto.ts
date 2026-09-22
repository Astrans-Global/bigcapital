import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ToNumber } from '@/common/decorators/Validators';

export class PdChequeEntryDto {
  @ToNumber()
  @IsInt()
  @IsNotEmpty()
  invoiceId: number;

  @ToNumber()
  @IsNumber()
  @IsNotEmpty()
  paymentAmount: number;

  @ToNumber()
  @IsOptional()
  @IsInt()
  index?: number;
}

export class CreatePdChequeDto {
  @ToNumber()
  @IsInt()
  @IsNotEmpty()
  @ApiProperty({ example: 1 })
  customerId: number;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: '123456' })
  chequeNo: string;

  @ToNumber()
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({ example: 20000 })
  amount: number;

  @IsDateString()
  @ApiProperty({ example: '2026-09-20' })
  collectedDate: string;

  @IsDateString()
  @ApiProperty({ example: '2026-10-15' })
  bankingDate: string;

  @IsOptional()
  @ToNumber()
  @IsNumber()
  exchangeRate?: number;

  @IsOptional()
  @ToNumber()
  @IsInt()
  branchId?: number;

  @IsOptional()
  @IsString()
  referenceNo?: string;

  @IsOptional()
  @IsString()
  statement?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PdChequeEntryDto)
  entries?: PdChequeEntryDto[];
}

export class EditPdChequeDto extends CreatePdChequeDto {}

export class PdChequeBankActionDto {
  @ToNumber()
  @IsInt()
  @IsNotEmpty()
  @ApiProperty({ example: 1 })
  bankAccountId: number;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ example: '2026-09-20' })
  realizeDate?: string;
}

export class GetPdChequesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @ToNumber()
  @IsInt()
  areaId?: number;

  @IsOptional()
  @Type(() => Number)
  @ToNumber()
  @IsInt()
  customerId?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsDateString()
  bankingDateFrom?: string;

  @IsOptional()
  @IsDateString()
  bankingDateTo?: string;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  chequeNo?: string;
}
