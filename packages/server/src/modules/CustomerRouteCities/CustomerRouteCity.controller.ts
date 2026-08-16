import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOperation,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { ApiCommonHeaders } from '@/common/decorators/ApiCommonHeaders';
import { CustomerRouteCityApplication } from './CustomerRouteCity.application';
import { GetCustomerRouteCitiesResponse } from './CustomerRouteCity.interfaces';
import {
  CreateCustomerRouteCityDto,
  EditCustomerRouteCityDto,
} from './dtos/CustomerRouteCity.dto';
import { GetCustomerRouteCitiesQueryDto } from './dtos/GetCustomerRouteCitiesQuery.dto';
import { CustomerRouteCityResponseDto } from './dtos/CustomerRouteCityResponse.dto';

@Controller('customer-route-cities')
@ApiTags('Customer Route Cities')
@ApiExtraModels(CustomerRouteCityResponseDto)
@ApiCommonHeaders()
export class CustomerRouteCityController {
  constructor(
    private readonly customerRouteCityApplication: CustomerRouteCityApplication,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new customer route city.' })
  async createCustomerRouteCity(
    @Body() routeCityDTO: CreateCustomerRouteCityDto,
  ) {
    return this.customerRouteCityApplication.createCustomerRouteCity(
      routeCityDTO,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Retrieves the customer route cities.' })
  @ApiResponse({
    status: 200,
    description:
      'The customer route cities have been successfully retrieved.',
    schema: {
      type: 'array',
      items: { $ref: getSchemaPath(CustomerRouteCityResponseDto) },
    },
  })
  async getCustomerRouteCities(
    @Query() filterDTO: GetCustomerRouteCitiesQueryDto,
  ): Promise<GetCustomerRouteCitiesResponse> {
    return this.customerRouteCityApplication.getCustomerRouteCities(
      filterDTO,
    );
  }

  @Put(':id')
  @ApiOperation({ summary: 'Edit the given customer route city.' })
  async editCustomerRouteCity(
    @Param('id') id: number,
    @Body() routeCityDTO: EditCustomerRouteCityDto,
  ) {
    return this.customerRouteCityApplication.editCustomerRouteCity(
      id,
      routeCityDTO,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieves the customer route city details.' })
  @ApiResponse({
    status: 200,
    description:
      'The customer route city details have been successfully retrieved.',
    schema: { $ref: getSchemaPath(CustomerRouteCityResponseDto) },
  })
  async getCustomerRouteCity(@Param('id') id: number) {
    return this.customerRouteCityApplication.getCustomerRouteCity(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete the given customer route city.' })
  async deleteCustomerRouteCity(@Param('id') id: number) {
    return this.customerRouteCityApplication.deleteCustomerRouteCity(id);
  }
}
