import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { ArrayMinSize, IsArray, IsInt } from 'class-validator';

export class GetDeliveryPrepTotalsQueryDto {
  // The global `SerializeInterceptor` already converts incoming snake_case
  // keys to camelCase before this DTO is populated -- no `@Expose({ name })`
  // needed (see docs/ops/PHASE1.md "Gotcha: DTO field naming").
  @Transform(({ value }) => {
    if (value == null || value === '') return [];
    const arr = Array.isArray(value) ? value : String(value).split(',');
    return arr.map((v) => Number(v));
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  @ApiProperty({
    example: '12,13,14',
    description:
      'Comma-separated sale invoice ids to total up (the ticked invoices)',
  })
  invoiceIds: number[];
}
