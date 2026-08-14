import { IsOptional, ToNumber } from '@/common/decorators/Validators';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class GetItemPriceLotsQueryDto {
  // See ItemSubcategories' GetItemSubcategoriesQuery.dto.ts for why this
  // snake_case alias is needed (useAuthApiFetcher/query params aren't
  // camelCase-transformed the way JSON bodies are).
  @Expose({ name: 'item_id' })
  @ToNumber()
  @IsInt()
  @Min(1)
  @IsOptional()
  @ApiPropertyOptional({ example: 12, description: 'Filter lots by item' })
  itemId?: number;

  @Expose({ name: 'warehouse_id' })
  @ToNumber()
  @IsInt()
  @Min(1)
  @IsOptional()
  @ApiPropertyOptional({ example: 3, description: 'Filter lots by warehouse' })
  warehouseId?: number;

  // When editing an invoice that already holds stock aside (Reserved/
  // Invoiced), that invoice's own hold shouldn't count against what it
  // can pick -- see `GetItemPriceLotsService` for how this is applied.
  @Expose({ name: 'exclude_invoice_id' })
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
