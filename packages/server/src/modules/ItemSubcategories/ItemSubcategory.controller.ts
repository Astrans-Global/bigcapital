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
import { ItemSubcategoryApplication } from './ItemSubcategory.application';
import { GetItemSubcategoriesResponse } from './ItemSubcategory.interfaces';
import {
  CreateItemSubcategoryDto,
  EditItemSubcategoryDto,
} from './dtos/ItemSubcategory.dto';
import { GetItemSubcategoriesQueryDto } from './dtos/GetItemSubcategoriesQuery.dto';
import { ItemSubcategoryResponseDto } from './dtos/ItemSubcategoryResponse.dto';

@Controller('item-subcategories')
@ApiTags('Item Subcategories')
@ApiExtraModels(ItemSubcategoryResponseDto)
@ApiCommonHeaders()
export class ItemSubcategoryController {
  constructor(
    private readonly itemSubcategoryApplication: ItemSubcategoryApplication,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new item subcategory.' })
  async createItemSubcategory(
    @Body() subcategoryDTO: CreateItemSubcategoryDto,
  ) {
    return this.itemSubcategoryApplication.createItemSubcategory(
      subcategoryDTO,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Retrieves the item subcategories.' })
  @ApiResponse({
    status: 200,
    description: 'The item subcategories have been successfully retrieved.',
    schema: {
      type: 'array',
      items: { $ref: getSchemaPath(ItemSubcategoryResponseDto) },
    },
  })
  async getItemSubcategories(
    @Query() filterDTO: GetItemSubcategoriesQueryDto,
  ): Promise<GetItemSubcategoriesResponse> {
    return this.itemSubcategoryApplication.getItemSubcategories(filterDTO);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Edit the given item subcategory.' })
  async editItemSubcategory(
    @Param('id') id: number,
    @Body() subcategoryDTO: EditItemSubcategoryDto,
  ) {
    return this.itemSubcategoryApplication.editItemSubcategory(
      id,
      subcategoryDTO,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieves the item subcategory details.' })
  @ApiResponse({
    status: 200,
    description:
      'The item subcategory details have been successfully retrieved.',
    schema: { $ref: getSchemaPath(ItemSubcategoryResponseDto) },
  })
  async getItemSubcategory(@Param('id') id: number) {
    return this.itemSubcategoryApplication.getItemSubcategory(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete the given item subcategory.' })
  async deleteItemSubcategory(@Param('id') id: number) {
    return this.itemSubcategoryApplication.deleteItemSubcategory(id);
  }
}
