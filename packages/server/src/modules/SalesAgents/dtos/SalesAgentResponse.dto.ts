import { ApiProperty } from '@nestjs/swagger';

export class SalesAgentResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Nimal' })
  name: string;

  @ApiProperty({ example: 12 })
  cashAccountId: number;

  @ApiProperty({ example: true })
  active: boolean;

  @ApiProperty({ example: 1 })
  userId: number;

  @ApiProperty({ example: '2024-03-20T10:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-03-20T10:00:00Z' })
  updatedAt: Date;
}
