import { IsInt, IsOptional } from 'class-validator';
import { ToNumber } from '@/common/decorators/Validators';

export class GetCustomerDueInvoicesQueryDto {
  @IsOptional()
  @IsInt()
  @ToNumber()
  excludeInvoiceId?: number;
}
