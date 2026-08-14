import { ApiProperty } from '@nestjs/swagger';

export class ItemPriceLotResponseDto {
  @ApiProperty({ example: 1, description: 'The unique identifier of the lot' })
  id: number;

  @ApiProperty({ example: 12, description: 'The item ID this lot belongs to' })
  itemId: number;

  @ApiProperty({ example: 3, description: 'The warehouse ID this lot belongs to' })
  warehouseId: number;

  @ApiProperty({
    example: 2000.0,
    description:
      'VAT-excluded, pre-discount unit list price from the originating GRN line(s)',
  })
  listPriceExclVat: number;

  @ApiProperty({
    example: 10,
    description:
      'Effective combined discount % (line + proportional header discount) relative to listPriceExclVat',
  })
  discountPercent: number;

  @ApiProperty({ example: 18, description: 'VAT % snapshot used for this lot' })
  vatRatePercent: number;

  @ApiProperty({
    example: 2124.0,
    description:
      'VAT-inclusive net cost per unit (the "lot cost"), derived from listPriceExclVat/discountPercent/vatRatePercent',
  })
  unitCostNet: number;

  @ApiProperty({ example: 100, description: 'Lifetime total received into this lot' })
  originalQty: number;

  @ApiProperty({ example: 60, description: 'Physical quantity remaining in the lot' })
  realQty: number;

  @ApiProperty({ example: 10, description: 'Quantity reserved by Reserved/Invoiced invoices' })
  reservedQty: number;

  @ApiProperty({
    example: 50,
    description: 'Quantity available for new reservations (realQty - reservedQty)',
  })
  floatQty: number;

  @ApiProperty({ example: '2026-08-14T10:00:00Z' })
  createdAt: Date;
}
