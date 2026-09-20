import { Knex } from 'knex';
import { SalesAgent } from './models/SalesAgent.model';

export interface ISalesAgentCreatedPayload {
  salesAgent: SalesAgent;
  trx: Knex.Transaction;
}

export interface ISalesAgentEditedPayload {
  oldSalesAgent: SalesAgent;
  salesAgent: SalesAgent;
  trx: Knex.Transaction;
}

export interface ISalesAgentDeletedPayload {
  salesAgentId: number;
  oldSalesAgent: SalesAgent;
}

export type GetSalesAgentsResponse = SalesAgent[];
