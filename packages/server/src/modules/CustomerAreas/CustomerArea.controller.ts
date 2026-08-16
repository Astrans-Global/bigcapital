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
import { CustomerAreaApplication } from './CustomerArea.application';
import { GetCustomerAreasResponse } from './CustomerArea.interfaces';
import {
  CreateCustomerAreaDto,
  EditCustomerAreaDto,
} from './dtos/CustomerArea.dto';
import { CustomerAreaResponseDto } from './dtos/CustomerAreaResponse.dto';

@Controller('customer-areas')
@ApiTags('Customer Areas')
@ApiExtraModels(CustomerAreaResponseDto)
@ApiCommonHeaders()
export class CustomerAreaController {
  constructor(
    private readonly customerAreaApplication: CustomerAreaApplication,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new customer area.' })
  async createCustomerArea(@Body() areaDTO: CreateCustomerAreaDto) {
    return this.customerAreaApplication.createCustomerArea(areaDTO);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieves the customer areas.' })
  @ApiResponse({
    status: 200,
    description: 'The customer areas have been successfully retrieved.',
    schema: {
      type: 'array',
      items: { $ref: getSchemaPath(CustomerAreaResponseDto) },
    },
  })
  async getCustomerAreas(): Promise<GetCustomerAreasResponse> {
    return this.customerAreaApplication.getCustomerAreas();
  }

  @Put(':id')
  @ApiOperation({ summary: 'Edit the given customer area.' })
  async editCustomerArea(
    @Param('id') id: number,
    @Body() areaDTO: EditCustomerAreaDto,
  ) {
    return this.customerAreaApplication.editCustomerArea(id, areaDTO);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieves the customer area details.' })
  @ApiResponse({
    status: 200,
    description: 'The customer area details have been successfully retrieved.',
    schema: { $ref: getSchemaPath(CustomerAreaResponseDto) },
  })
  async getCustomerArea(@Param('id') id: number) {
    return this.customerAreaApplication.getCustomerArea(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete the given customer area.' })
  async deleteCustomerArea(@Param('id') id: number) {
    return this.customerAreaApplication.deleteCustomerArea(id);
  }
}
