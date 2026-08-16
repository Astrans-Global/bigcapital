import { ApiProperty } from '@nestjs/swagger';

export class CustomerRouteCityResponseDto {
  @ApiProperty({ example: 1, description: 'The unique identifier of the route city' })
  id: number;

  @ApiProperty({ example: 'Nugegoda', description: 'The name of the route city' })
  name: string;

  @ApiProperty({ example: 1, description: 'The parent area ID' })
  areaId: number;

  @ApiProperty({ example: 1, description: 'The user ID who created the route city' })
  userId: number;

  @ApiProperty({ example: '2024-03-20T10:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-03-20T10:00:00Z' })
  updatedAt: Date;
}
