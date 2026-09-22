import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';
import { ToNumber } from '@/common/decorators/Validators';

export class CreateBankReconciliationDto {
  @ToNumber()
  @IsInt()
  @IsNotEmpty()
  @ApiProperty({ example: 1 })
  accountId: number;

  @IsDateString()
  @ApiProperty({ example: '2026-09-01' })
  startDate: string;

  @IsDateString()
  @ApiProperty({ example: '2026-09-30' })
  endDate: string;

  @ToNumber()
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({ example: 125000.5 })
  endingBalance: number;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}$/)
  @ApiPropertyOptional({ example: '2026-09' })
  periodMonth?: string;
}

export class BankReconciliationLineDto {
  @ToNumber()
  @IsInt()
  @IsNotEmpty()
  accountTransactionId: number;

  @IsBoolean()
  ticked: boolean;
}

export class SaveBankReconciliationDraftDto {
  @IsOptional()
  @ToNumber()
  @IsNumber()
  endingBalance?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BankReconciliationLineDto)
  lines?: BankReconciliationLineDto[];
}

export class GetBankReconciliationsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @ToNumber()
  @IsInt()
  accountId?: number;
}

export class GetBankReconciliationQueryDto {
  @IsOptional()
  @Type(() => Boolean)
  hideAfterStatementDate?: boolean;
}

export class GetBankRecEligibilityQueryDto {
  @IsOptional()
  @Type(() => Number)
  @ToNumber()
  @IsInt()
  accountId?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;
}
