import { IsOptional, ToNumber } from '@/common/decorators/Validators';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class GetItemSubcategoriesQueryDto {
  // See `ItemSubcategory.dto.ts` for why this alias is needed.
  @Expose({ name: 'category_id' })
  @ToNumber()
  @IsInt()
  @Min(1)
  @IsOptional()
  @ApiPropertyOptional({
    example: 1,
    description: 'Filter subcategories that belong to the given category',
  })
  categoryId?: number;
}
