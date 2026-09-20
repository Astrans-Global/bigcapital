import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOperation,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { ApiCommonHeaders } from '@/common/decorators/ApiCommonHeaders';
import { SalesAgentApplication } from './SalesAgent.application';
import { GetSalesAgentsResponse } from './SalesAgent.interfaces';
import {
  CreateSalesAgentDto,
  EditSalesAgentDto,
} from './dtos/SalesAgent.dto';
import { SalesAgentResponseDto } from './dtos/SalesAgentResponse.dto';

@Controller('sales-agents')
@ApiTags('Sales Agents')
@ApiExtraModels(SalesAgentResponseDto)
@ApiCommonHeaders()
export class SalesAgentController {
  constructor(
    private readonly salesAgentApplication: SalesAgentApplication,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new sales agent.' })
  async createSalesAgent(@Body() agentDTO: CreateSalesAgentDto) {
    return this.salesAgentApplication.createSalesAgent(agentDTO);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieves the sales agents.' })
  @ApiResponse({
    status: 200,
    schema: {
      type: 'array',
      items: { $ref: getSchemaPath(SalesAgentResponseDto) },
    },
  })
  async getSalesAgents(): Promise<GetSalesAgentsResponse> {
    return this.salesAgentApplication.getSalesAgents();
  }

  @Put(':id')
  @ApiOperation({ summary: 'Edit the given sales agent.' })
  async editSalesAgent(
    @Param('id') id: number,
    @Body() agentDTO: EditSalesAgentDto,
  ) {
    return this.salesAgentApplication.editSalesAgent(id, agentDTO);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieves the sales agent details.' })
  @ApiResponse({
    status: 200,
    schema: { $ref: getSchemaPath(SalesAgentResponseDto) },
  })
  async getSalesAgent(@Param('id') id: number) {
    return this.salesAgentApplication.getSalesAgent(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete the given sales agent.' })
  async deleteSalesAgent(@Param('id') id: number) {
    return this.salesAgentApplication.deleteSalesAgent(id);
  }
}
