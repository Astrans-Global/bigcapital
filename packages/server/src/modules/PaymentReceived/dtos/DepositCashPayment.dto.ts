import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsNotEmpty, IsOptional } from 'class-validator';
import { ToNumber } from '@/common/decorators/Validators';

export class DepositCashPaymentDto {
  @ToNumber()
  @IsInt()
  @IsNotEmpty()
  @ApiProperty({ description: 'Bank account to deposit into', example: 1 })
  bankAccountId: number;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({
    description: 'Deposit date (defaults to today)',
    example: '2026-09-20',
  })
  depositDate?: string;
}
