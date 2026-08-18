import { IsOptional, ToNumber } from '@/common/decorators/Validators';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, Min } from 'class-validator';

export class GetSecondaryPnlQueryDto {
  // The global `SerializeInterceptor` already converts incoming snake_case
  // keys to camelCase before this DTO is populated -- no `@Expose({ name })`
  // needed (see docs/ops/PHASE1.md "Gotcha: DTO field naming").
  @ToNumber()
  @IsInt()
  @Min(1)
  @IsOptional()
  @ApiPropertyOptional({ example: 3, description: 'Filter by warehouse' })
  warehouseId?: number;

  @ToNumber()
  @IsInt()
  @Min(1)
  @IsOptional()
  @ApiPropertyOptional({ example: 1, description: "Filter by customer's area" })
  areaId?: number;

  @IsDateString()
  @IsOptional()
  @ApiPropertyOptional({
    example: '2026-08-01',
    description: 'Invoice date range start (inclusive)',
  })
  dateFrom?: string;

  @IsDateString()
  @IsOptional()
  @ApiPropertyOptional({
    example: '2026-08-31',
    description: 'Invoice date range end (inclusive)',
  })
  dateTo?: string;
}
