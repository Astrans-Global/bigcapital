import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import { DMS_STATUSES, DmsStatus } from '../ItemPriceLots.constants';

export class SetInvoiceDmsStatusDto {
  @IsNotEmpty()
  @IsString()
  @IsIn(DMS_STATUSES)
  @ApiProperty({
    description: 'The Astrans DMS status to move the invoice to',
    enum: DMS_STATUSES,
    example: 'reserved',
  })
  status: DmsStatus;
}
