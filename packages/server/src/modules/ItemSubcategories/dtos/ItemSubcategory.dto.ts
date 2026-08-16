import { IsOptional, ToNumber } from '@/common/decorators/Validators';
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, MaxLength, Min } from 'class-validator';

class CommandItemSubcategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @ApiProperty({
    example: 'Detergents',
    description: 'The subcategory name',
  })
  name: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    example: 'Liquid and powder detergents',
    description: 'The subcategory description',
    required: false,
  })
  description?: string;

  // The global `SerializeInterceptor` already converts incoming snake_case
  // keys (e.g. `category_id`) to camelCase before this DTO is populated, so
  // this just needs to match that camelCase name - no `@Expose({ name })`.
  @ToNumber()
  @IsInt()
  @Min(1)
  @ApiProperty({ example: 1, description: 'The parent category ID' })
  categoryId: number;
}

export class CreateItemSubcategoryDto extends CommandItemSubcategoryDto {}
export class EditItemSubcategoryDto extends CommandItemSubcategoryDto {}
