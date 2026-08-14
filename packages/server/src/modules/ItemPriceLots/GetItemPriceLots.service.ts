import { Inject, Injectable } from '@nestjs/common';
import { ItemPriceLot } from './models/ItemPriceLot.model';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { GetItemPriceLotsQueryDto } from './dtos/GetItemPriceLotsQuery.dto';

@Injectable()
export class GetItemPriceLotsService {
  constructor(
    @Inject(ItemPriceLot.name)
    private readonly itemPriceLotModel: TenantModelProxy<typeof ItemPriceLot>,
  ) {}

  /**
   * Retrieves item price-lots, optionally filtered by item/warehouse.
   * Ordered oldest-first, since that's the natural default a user would
   * expect to see when picking which purchase batch to bill from.
   * @param {GetItemPriceLotsQueryDto} filterDto -
   */
  public async getItemPriceLots(filterDto: GetItemPriceLotsQueryDto) {
    const lots = await this.itemPriceLotModel()
      .query()
      .onBuild((query) => {
        if (filterDto?.itemId) {
          query.where('item_id', filterDto.itemId);
        }
        if (filterDto?.warehouseId) {
          query.where('warehouse_id', filterDto.warehouseId);
        }
        query.orderBy('created_at', 'asc');
      });

    return lots;
  }
}
