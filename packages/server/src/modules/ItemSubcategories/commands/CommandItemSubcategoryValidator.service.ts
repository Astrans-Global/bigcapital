import { Inject, Injectable } from '@nestjs/common';
import { ItemSubcategory } from '../models/ItemSubcategory.model';
import {
  ItemCategory,
} from '@/modules/ItemCategories/models/ItemCategory.model';
import { ServiceError } from '@/modules/Items/ServiceError';
import { ERRORS } from '../constants';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';

@Injectable()
export class CommandItemSubcategoryValidatorService {
  /**
   * @param {TenantModelProxy<typeof ItemSubcategory>} itemSubcategoryModel - Item subcategory model.
   * @param {TenantModelProxy<typeof ItemCategory>} itemCategoryModel - Item category model.
   */
  constructor(
    @Inject(ItemSubcategory.name)
    private readonly itemSubcategoryModel: TenantModelProxy<
      typeof ItemSubcategory
    >,

    @Inject(ItemCategory.name)
    private readonly itemCategoryModel: TenantModelProxy<typeof ItemCategory>,
  ) {}

  /**
   * Validates the subcategory name uniquiness within the given category.
   * @param {string} subcategoryName - Subcategory name.
   * @param {number} categoryId - Parent category id.
   * @param {number} notSubcategoryId - Ignore the subcategory id (for edits).
   */
  public async validateSubcategoryNameUniquiness(
    subcategoryName: string,
    categoryId: number,
    notSubcategoryId?: number,
  ) {
    const foundSubcategory = await this.itemSubcategoryModel()
      .query()
      .findOne('name', subcategoryName)
      .where('category_id', categoryId)
      .onBuild((query) => {
        if (notSubcategoryId) {
          query.whereNot('id', notSubcategoryId);
        }
      });

    if (foundSubcategory) {
      throw new ServiceError(
        ERRORS.SUBCATEGORY_NAME_EXISTS,
        'The item subcategory name already exists under this category.',
      );
    }
  }

  /**
   * Validates the parent category existance.
   * @param {number} categoryId - Category id.
   */
  public async validateCategoryExistance(categoryId: number) {
    const foundCategory = await this.itemCategoryModel()
      .query()
      .findById(categoryId);

    if (!foundCategory) {
      throw new ServiceError(
        ERRORS.CATEGORY_NOT_FOUND,
        'The parent item category was not found.',
      );
    }
  }
}
