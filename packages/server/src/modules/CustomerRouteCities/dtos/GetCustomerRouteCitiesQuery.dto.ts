import { IsOptional, ToNumber } from '@/common/decorators/Validators';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class GetCustomerRouteCitiesQueryDto {
  // See `CustomerRouteCity.dto.ts` - the global interceptor already
  // camelCases this before it gets here, so no `@Expose({ name })` alias.
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
