import { Model } from 'objection';
import { TenantBaseModel } from '@/modules/System/models/TenantBaseModel';
import { InjectModelMeta } from '@/modules/Tenancy/TenancyModels/decorators/InjectModelMeta.decorator';
import { CustomerAreaMeta } from './CustomerArea.meta';

@InjectModelMeta(CustomerAreaMeta)
export class CustomerArea extends TenantBaseModel {
  name!: string;
  invoiceNumberCode!: string | null;
  nextInvoiceNumber!: number;
  nextCustomerNumber!: number;
  userId!: number;

  /**
   * Table name.
   */
  static get tableName() {
    return 'customer_areas';
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
    const {
      CustomerRouteCity,
    } = require('../../CustomerRouteCities/models/CustomerRouteCity.model');
    const { Customer } = require('../../Customers/models/Customer');

    return {
      /**
       * Area has many route cities.
       */
      routeCities: {
        relation: Model.HasManyRelation,
        modelClass: CustomerRouteCity,
        join: {
          from: 'customer_areas.id',
          to: 'customer_route_cities.areaId',
        },
      },

      /**
       * Area has many customers.
       */
      customers: {
        relation: Model.HasManyRelation,
        modelClass: Customer,
        join: {
          from: 'customer_areas.id',
          to: 'contacts.areaId',
        },
      },
    };
  }
}
