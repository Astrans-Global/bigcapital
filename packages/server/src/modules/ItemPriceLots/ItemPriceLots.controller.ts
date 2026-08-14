import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOperation,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { ApiCommonHeaders } from '@/common/decorators/ApiCommonHeaders';
import { ItemPriceLotsApplication } from './ItemPriceLots.application';
import { GetItemPriceLotsQueryDto } from './dtos/GetItemPriceLotsQuery.dto';
import { ItemPriceLotResponseDto } from './dtos/ItemPriceLotResponse.dto';

@Controller('item-price-lots')
@ApiTags('Item Price Lots')
@ApiExtraModels(ItemPriceLotResponseDto)
@ApiCommonHeaders()
export class ItemPriceLotsController {
  constructor(
    private readonly itemPriceLotsApplication: ItemPriceLotsApplication,
  ) {}

  @Get()
  @ApiOperation({
    summary:
      'Retrieves item price-lots (GRN cost batches) for the item/warehouse picker.',
  })
  @ApiResponse({
    status: 200,
    description: 'The item price-lots have been successfully retrieved.',
    schema: {
      type: 'array',
      items: { $ref: getSchemaPath(ItemPriceLotResponseDto) },
    },
  })
  async getItemPriceLots(@Query() filterDTO: GetItemPriceLotsQueryDto) {
    return this.itemPriceLotsApplication.getItemPriceLots(filterDTO);
  }
}
