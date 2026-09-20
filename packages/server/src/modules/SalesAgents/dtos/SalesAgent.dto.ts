import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

class CommandSalesAgentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @ApiProperty({ example: 'Nimal', description: 'The agent name' })
  name: string;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    example: true,
    required: false,
    description: 'Whether the agent is active',
  })
  active?: boolean;
}

export class CreateSalesAgentDto extends CommandSalesAgentDto {}
export class EditSalesAgentDto extends CommandSalesAgentDto {}
