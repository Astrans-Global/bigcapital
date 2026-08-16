import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsString,
  Matches,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ContactAddressDto } from './ContactAddress.dto';
import { IsOptional, ToNumber } from '@/common/decorators/Validators';

export class EditCustomerDto extends ContactAddressDto {
  @ApiProperty({ required: true, description: 'Customer type' })
  @IsString()
  @IsNotEmpty()
  customerType: string;

  @ApiProperty({ required: false, description: 'Salutation' })
  @IsOptional()
  @IsString()
  salutation?: string;

  @ApiProperty({ required: false, description: 'First name' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ required: false, description: 'Last name' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ required: false, description: 'Company name' })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiProperty({ required: true, description: 'Display name' })
  @IsString()
  @IsNotEmpty()
  displayName: string;

  @ApiProperty({ required: false, description: 'Website' })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiProperty({ required: false, description: 'Email' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false, description: 'Work phone' })
  @IsOptional()
  @IsString()
  workPhone?: string;

  @ApiProperty({ required: false, description: 'Personal phone' })
  @IsOptional()
  @IsString()
  personalPhone?: string;

  @ApiProperty({ required: false, description: 'Note' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiProperty({ required: false, description: 'Active status' })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiProperty({ required: false, description: 'Customer code' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({
    required: false,
    description: 'The area the customer belongs to',
  })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  areaId?: number;

  @ApiProperty({
    required: false,
    description:
      'The route city the customer belongs to (must be under the selected area)',
  })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  routeCityId?: number;

  @ApiProperty({ required: false, description: 'VAT/TIN number (9 digits)' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{9}$/, { message: 'tinNumber must be exactly 9 digits' })
  tinNumber?: string;
}
