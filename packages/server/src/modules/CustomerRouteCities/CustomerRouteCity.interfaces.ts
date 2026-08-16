import { Knex } from 'knex';
import { CustomerRouteCity } from './models/CustomerRouteCity.model';

export interface ICustomerRouteCityCreatedPayload {
  customerRouteCity: CustomerRouteCity;
  trx: Knex.Transaction;
}

export interface ICustomerRouteCityEditedPayload {
  oldCustomerRouteCity: CustomerRouteCity;
  customerRouteCity: CustomerRouteCity;
  trx: Knex.Transaction;
}

export interface ICustomerRouteCityDeletedPayload {
  customerRouteCityId: number;
  oldCustomerRouteCity: CustomerRouteCity;
}

export type GetCustomerRouteCitiesResponse = CustomerRouteCity[];
