import { ToNumber } from '@/common/decorators/Validators';
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, MaxLength, Min } from 'class-validator';

class CommandCustomerRouteCityDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @ApiProperty({ example: 'Nugegoda', description: 'The route city name' })
  name: string;

  // The global `SerializeInterceptor` already converts the incoming
  // request's snake_case keys (e.g. `area_id`) to camelCase before this DTO
  // is populated, so this property just needs to match that camelCase name
  // directly - no `@Expose({ name })` alias needed (that would actually look
  // for the now-nonexistent `area_id` key and silently leave this undefined).
  @ToNumber()
  @IsInt()
  @Min(1)
  @ApiProperty({ example: 1, description: 'The parent area ID' })
  areaId: number;
}

export class CreateCustomerRouteCityDto extends CommandCustomerRouteCityDto {}
export class EditCustomerRouteCityDto extends CommandCustomerRouteCityDto {}
