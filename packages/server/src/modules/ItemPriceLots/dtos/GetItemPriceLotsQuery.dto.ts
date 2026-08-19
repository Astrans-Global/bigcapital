import { IsOptional, ToNumber } from '@/common/decorators/Validators';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsInt, Min } from 'class-validator';

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

  // Credit-note restock picker: show lots even at zero float so the user
  // can put returned stock back onto the original (or any) batch.
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional({
    example: false,
    description:
      'When true, the picker should still list lots with zero float quantity',
  })
  includeZeroQty?: boolean;
}
