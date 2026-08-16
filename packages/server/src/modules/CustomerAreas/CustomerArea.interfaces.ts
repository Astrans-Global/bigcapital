import { Knex } from 'knex';
import { CustomerArea } from './models/CustomerArea.model';

export interface ICustomerAreaCreatedPayload {
  customerArea: CustomerArea;
  trx: Knex.Transaction;
}

export interface ICustomerAreaEditedPayload {
  oldCustomerArea: CustomerArea;
  customerArea: CustomerArea;
  trx: Knex.Transaction;
}

export interface ICustomerAreaDeletedPayload {
  customerAreaId: number;
  oldCustomerArea: CustomerArea;
}

export type GetCustomerAreasResponse = CustomerArea[];
