import { Injectable } from '@nestjs/common';
import { GetItemPriceLotsService } from './GetItemPriceLots.service';
import { GetItemPriceLotsQueryDto } from './dtos/GetItemPriceLotsQuery.dto';

@Injectable()
export class ItemPriceLotsApplication {
  constructor(
    private readonly getItemPriceLotsService: GetItemPriceLotsService,
  ) {}

  /**
   * Retrieves item price-lots, optionally filtered by item/warehouse.
   */
  public getItemPriceLots(filterDTO: GetItemPriceLotsQueryDto) {
    return this.getItemPriceLotsService.getItemPriceLots(filterDTO);
  }
}
