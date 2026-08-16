import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { ToNumber } from '@/common/decorators/Validators';

class CommandCustomerAreaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @ApiProperty({ example: 'Colombo', description: 'The area name' })
  name: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^[A-Za-z0-9]{2}$/, {
    message: 'invoiceNumberCode must be exactly 2 letters/digits',
  })
  @ApiProperty({
    example: '01',
    required: true,
    description:
      "The 2-character code for this area (the 'QQ' in customer code QQ-0001 and invoice number YYMMM_ASTRANSQQ_XXXXX)",
  })
  invoiceNumberCode: string;

  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  @ApiProperty({
    example: 10001,
    required: false,
    default: 10001,
    description:
      'The next invoice number to use for this area (for future per-area numbering)',
  })
  nextInvoiceNumber?: number;
}

export class CreateCustomerAreaDto extends CommandCustomerAreaDto {}
export class EditCustomerAreaDto extends CommandCustomerAreaDto {}
