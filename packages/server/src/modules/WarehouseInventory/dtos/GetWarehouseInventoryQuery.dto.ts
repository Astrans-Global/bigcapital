import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsInt, Min } from 'class-validator';
import { IsOptional, ToNumber } from '@/common/decorators/Validators';

const ToBoolean = () =>
  Transform(({ value }) => {
    if (value == null || value === '') return undefined;
    if (typeof value === 'boolean') return value;
    return value === true || value === 'true' || value === '1';
  });

export class GetWarehouseInventoryQueryDto {
  // The global `SerializeInterceptor` already converts incoming snake_case
  // keys to camelCase before this DTO is populated -- no `@Expose({ name })`
  // needed (see docs/ops/PHASE1.md "Gotcha: DTO field naming").
  @ToNumber()
  @IsInt()
  @Min(1)
  @IsOptional()
  @ApiPropertyOptional({ example: 1, description: 'Filter by warehouse' })
  warehouseId?: number;

  @ToBoolean()
  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional({
    example: false,
    description:
      'When true, lots with real qty = 0 are omitted. Default false (zeros still show).',
  })
  hideZeroQty?: boolean;

  @ToBoolean()
  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional({
    example: false,
    description:
      'When true, float = real − (reserved + invoiced). When false (default), float = real − reserved only. See docs/ops/PHASE1.md ("Warehouse inventory").',
  })
  includeInvoicedInFloat?: boolean;
}
