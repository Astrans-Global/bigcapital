import { ApiProperty } from '@nestjs/swagger';

export class ItemSubcategoryResponseDto {
  @ApiProperty({
    example: 1,
    description: 'The unique identifier of the item subcategory',
  })
  id: number;

  @ApiProperty({
    example: 'Detergents',
    description: 'The name of the item subcategory',
  })
  name: string;

  @ApiProperty({
    example: 'Liquid and powder detergents',
    description: 'The description of the item subcategory',
    required: false,
  })
  description?: string;

  @ApiProperty({
    example: 1,
    description: 'The parent category ID',
  })
  categoryId: number;

  @ApiProperty({
    example: 1,
    description: 'The user ID who created the subcategory',
  })
  userId: number;

  @ApiProperty({
    example: '2024-03-20T10:00:00Z',
    description: 'The creation date of the subcategory',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-03-20T10:00:00Z',
    description: 'The last update date of the subcategory',
  })
  updatedAt: Date;
}
