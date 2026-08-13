import { IsOptional, ToNumber } from '@/common/decorators/Validators';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
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

  // `@Expose({ name })` binds this field from the legacy snake_case key
  // (`category_id`) that the webapp's SDK request middleware sends by
  // default, since `plainToInstance` copies plain keys verbatim otherwise
  // and `category_id` would be silently whitelist-stripped.
  @Expose({ name: 'category_id' })
  @ToNumber()
  @IsInt()
  @Min(1)
  @ApiProperty({ example: 1, description: 'The parent category ID' })
  categoryId: number;
}

export class CreateItemSubcategoryDto extends CommandItemSubcategoryDto {}
export class EditItemSubcategoryDto extends CommandItemSubcategoryDto {}
