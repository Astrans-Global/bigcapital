import { IsOptional, ToNumber } from '@/common/decorators/Validators';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class GetCustomerRouteCitiesQueryDto {
  // See `CustomerRouteCity.dto.ts` for why this alias is needed.
  @Expose({ name: 'area_id' })
  @ToNumber()
  @IsInt()
  @Min(1)
  @IsOptional()
  @ApiPropertyOptional({
    example: 1,
    description: 'Filter route cities that belong to the given area',
  })
  areaId?: number;
}
