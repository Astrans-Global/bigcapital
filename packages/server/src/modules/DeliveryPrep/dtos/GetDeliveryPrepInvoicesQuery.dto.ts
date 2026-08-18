import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsDateString, IsIn, IsInt, Min } from 'class-validator';
import { IsOptional, ToNumber } from '@/common/decorators/Validators';

const DMS_STATUSES = ['pending', 'reserved', 'invoiced', 'delivered'] as const;

/**
 * Splits a comma-separated query-string value into an array -- query
 * strings don't carry array types natively, and this endpoint's filters
 * (route city, status) are webapp-only tick-box multi-selects, see
 * docs/ops/PHASE1.md ("Delivery Prep").
 */
const ToArray = () =>
  Transform(({ value }) => {
    if (value == null || value === '') return undefined;
    return Array.isArray(value) ? value : String(value).split(',');
  });

const ToNumberArray = () =>
  Transform(({ value }) => {
    if (value == null || value === '') return undefined;
    const arr = Array.isArray(value) ? value : String(value).split(',');
    return arr.map((v) => Number(v));
  });

export class GetDeliveryPrepInvoicesQueryDto {
  // The global `SerializeInterceptor` already converts incoming snake_case
  // keys to camelCase before this DTO is populated -- no `@Expose({ name })`
  // needed (see docs/ops/PHASE1.md "Gotcha: DTO field naming").
  @ToNumber()
  @IsInt()
  @Min(1)
  @IsOptional()
  @ApiPropertyOptional({ example: 1, description: 'Filter by warehouse' })
  warehouseId?: number;

  @ToNumber()
  @IsInt()
  @Min(1)
  @IsOptional()
  @ApiPropertyOptional({ example: 1, description: "Filter by customer's area" })
  areaId?: number;

  @ToNumberArray()
  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  @ApiPropertyOptional({
    example: '1,2',
    description:
      "Filter by customer's route city -- comma-separated ids (tick-box multi-select)",
  })
  routeCityId?: number[];

  @ToArray()
  @IsArray()
  @IsIn(DMS_STATUSES, { each: true })
  @IsOptional()
  @ApiPropertyOptional({
    example: 'pending,reserved',
    description:
      'Filter by DMS status -- comma-separated (tick-box multi-select). Omit for all statuses.',
  })
  dmsStatus?: (typeof DMS_STATUSES)[number][];

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
