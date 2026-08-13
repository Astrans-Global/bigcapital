import { Model } from 'objection';
import { TenantBaseModel } from '@/modules/System/models/TenantBaseModel';
import { InjectModelMeta } from '@/modules/Tenancy/TenancyModels/decorators/InjectModelMeta.decorator';
import { ItemSubcategoryMeta } from './ItemSubcategory.meta';

@InjectModelMeta(ItemSubcategoryMeta)
export class ItemSubcategory extends TenantBaseModel {
  name!: string;
  description!: string;

  categoryId!: number;
  userId!: number;

  /**
   * Table name.
   */
  static get tableName() {
    return 'items_subcategories';
  }

  /**
   * Timestamps columns.
   */
  get timestamps() {
    return ['createdAt', 'updatedAt'];
  }

  /**
   * Relationship mapping.
   */
  static get relationMappings() {
    const { Item } = require('../../Items/models/Item');
    const {
      ItemCategory,
    } = require('../../ItemCategories/models/ItemCategory.model');

    return {
      /**
       * Item subcategory belongs to item category.
       */
      category: {
        relation: Model.BelongsToOneRelation,
        modelClass: ItemCategory,
        join: {
          from: 'items_subcategories.categoryId',
          to: 'items_categories.id',
        },
      },

      /**
       * Item subcategory may has many items.
       */
      items: {
        relation: Model.HasManyRelation,
        modelClass: Item,
        join: {
          from: 'items_subcategories.id',
          to: 'items.subcategoryId',
        },
      },
    };
  }
}
