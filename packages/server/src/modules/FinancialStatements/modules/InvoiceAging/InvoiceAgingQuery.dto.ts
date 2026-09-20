import { Transform } from 'class-transformer';
import { IsArray, IsDateString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class InvoiceAgingQueryDto {
  @IsDateString()
  @IsOptional()
  @ApiPropertyOptional({ example: '2026-09-20' })
  asDate?: string;

  @IsArray()
  @IsOptional()
  @Transform(({ value }) => {
    if (value == null || value === '') {
      return [];
    }
    return Array.isArray(value) ? value.map(Number) : [Number(value)];
  })
  areaIds?: number[];
}
