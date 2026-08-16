import { IsOptional, ToNumber } from '@/common/decorators/Validators';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, MaxLength, Min } from 'class-validator';

class CommandCustomerRouteCityDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @ApiProperty({ example: 'Nugegoda', description: 'The route city name' })
  name: string;

  // `@Expose({ name })` binds this field from the legacy snake_case key
  // (`area_id`) that the webapp's SDK request middleware sends by default,
  // mirroring the same pattern used for item subcategories' `category_id`.
  @Expose({ name: 'area_id' })
  @ToNumber()
  @IsInt()
  @Min(1)
  @ApiProperty({ example: 1, description: 'The parent area ID' })
  areaId: number;
}

export class CreateCustomerRouteCityDto extends CommandCustomerRouteCityDto {}
export class EditCustomerRouteCityDto extends CommandCustomerRouteCityDto {}
