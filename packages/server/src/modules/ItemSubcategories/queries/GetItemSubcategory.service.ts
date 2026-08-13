import { Inject, Injectable } from '@nestjs/common';
import { ItemSubcategory } from '../models/ItemSubcategory.model';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';

@Injectable()
export class GetItemSubcategoryService {
  /**
   * @param {typeof ItemSubcategory} itemSubcategoryModel - Item subcategory model.
   */
  constructor(
    @Inject(ItemSubcategory.name)
    private readonly itemSubcategoryModel: TenantModelProxy<
      typeof ItemSubcategory
    >,
  ) {}

  /**
   * Retrieves item subcategory by id.
   * @param {number} itemSubcategoryId
   * @returns {Promise<ItemSubcategory>}
   */
  public async getItemSubcategory(itemSubcategoryId: number) {
    const itemSubcategory = await this.itemSubcategoryModel()
      .query()
      .findById(itemSubcategoryId)
      .throwIfNotFound();

    return itemSubcategory;
  }
}
