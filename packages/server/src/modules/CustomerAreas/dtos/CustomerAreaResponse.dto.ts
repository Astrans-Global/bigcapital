import { ApiProperty } from '@nestjs/swagger';

export class CustomerAreaResponseDto {
  @ApiProperty({ example: 1, description: 'The unique identifier of the area' })
  id: number;

  @ApiProperty({ example: 'Colombo', description: 'The name of the area' })
  name: string;

  @ApiProperty({
    example: '01',
    required: false,
    description: 'The 2-character invoice numbering code for this area',
  })
  invoiceNumberCode?: string;

  @ApiProperty({
    example: 10001,
    description: 'The next invoice number to use for this area',
  })
  nextInvoiceNumber: number;

  @ApiProperty({ example: 1, description: 'The user ID who created the area' })
  userId: number;

  @ApiProperty({ example: '2024-03-20T10:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-03-20T10:00:00Z' })
  updatedAt: Date;
}
