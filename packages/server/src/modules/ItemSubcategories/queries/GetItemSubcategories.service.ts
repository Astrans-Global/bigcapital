import { Inject, Injectable } from '@nestjs/common';
import { ItemSubcategory } from '../models/ItemSubcategory.model';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { GetItemSubcategoriesQueryDto } from '../dtos/GetItemSubcategoriesQuery.dto';
import { GetItemSubcategoriesResponse } from '../ItemSubcategory.interfaces';

@Injectable()
export class GetItemSubcategoriesService {
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
   * Retrieves the item subcategories list, optionally filtered by category.
   * @param {GetItemSubcategoriesQueryDto} filterDto
   * @returns {Promise<GetItemSubcategoriesResponse>}
   */
  public async getItemSubcategories(
    filterDto: GetItemSubcategoriesQueryDto,
  ): Promise<GetItemSubcategoriesResponse> {
    const subcategories = await this.itemSubcategoryModel()
      .query()
      .onBuild((query) => {
        if (filterDto?.categoryId) {
          query.where('category_id', filterDto.categoryId);
        }
        query.orderBy('name', 'asc');
      });

    return subcategories;
  }
}
