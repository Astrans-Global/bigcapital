import { IsOptional, ToNumber } from '@/common/decorators/Validators';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class GetItemPriceLotsQueryDto {
  // The global `SerializeInterceptor` already converts incoming snake_case
  // keys (e.g. `item_id`) to camelCase before this DTO is populated, so
  // these just need to match that camelCase name - no `@Expose({ name })`.
  @ToNumber()
  @IsInt()
  @Min(1)
  @IsOptional()
  @ApiPropertyOptional({ example: 12, description: 'Filter lots by item' })
  itemId?: number;

  @ToNumber()
  @IsInt()
  @Min(1)
  @IsOptional()
  @ApiPropertyOptional({ example: 3, description: 'Filter lots by warehouse' })
  warehouseId?: number;

  // When editing an invoice that already holds stock aside (Reserved/
  // Invoiced), that invoice's own hold shouldn't count against what it
  // can pick -- see `GetItemPriceLotsService` for how this is applied.
  @ToNumber()
  @IsInt()
  @Min(1)
  @IsOptional()
  @ApiPropertyOptional({
    example: 45,
    description:
      "Adds this invoice's own active holds back into each lot's float quantity",
  })
  excludeInvoiceId?: number;
}
