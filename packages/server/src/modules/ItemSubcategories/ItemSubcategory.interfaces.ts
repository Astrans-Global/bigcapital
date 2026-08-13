import { Knex } from 'knex';
import { ItemSubcategory } from './models/ItemSubcategory.model';

export interface IItemSubcategoryOTD {
  name: string;
  description?: string;
  categoryId: number;
  userId?: number;
}

export interface IItemSubcategoryCreatedPayload {
  itemSubcategory: ItemSubcategory;
  trx: Knex.Transaction;
}

export interface IItemSubcategoryEditedPayload {
  oldItemSubcategory: ItemSubcategory;
  itemSubcategory: ItemSubcategory;
  trx: Knex.Transaction;
}

export interface IItemSubcategoryDeletedPayload {
  itemSubcategoryId: number;
  oldItemSubcategory: ItemSubcategory;
}

export type GetItemSubcategoriesResponse = ItemSubcategory[];
