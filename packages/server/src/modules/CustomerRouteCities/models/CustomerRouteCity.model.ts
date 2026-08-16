import { Model } from 'objection';
import { TenantBaseModel } from '@/modules/System/models/TenantBaseModel';
import { InjectModelMeta } from '@/modules/Tenancy/TenancyModels/decorators/InjectModelMeta.decorator';
import { CustomerRouteCityMeta } from './CustomerRouteCity.meta';

@InjectModelMeta(CustomerRouteCityMeta)
export class CustomerRouteCity extends TenantBaseModel {
  name!: string;
  areaId!: number;
  userId!: number;

  /**
   * Table name.
   */
  static get tableName() {
    return 'customer_route_cities';
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
    const { CustomerArea } = require('../../CustomerAreas/models/CustomerArea.model');
    const { Customer } = require('../../Customers/models/Customer');

    return {
      /**
       * Route city belongs to area.
       */
      area: {
        relation: Model.BelongsToOneRelation,
        modelClass: CustomerArea,
        join: {
          from: 'customer_route_cities.areaId',
          to: 'customer_areas.id',
        },
      },

      /**
       * Route city may have many customers.
       */
      customers: {
        relation: Model.HasManyRelation,
        modelClass: Customer,
        join: {
          from: 'customer_route_cities.id',
          to: 'contacts.routeCityId',
        },
      },
    };
  }
}
