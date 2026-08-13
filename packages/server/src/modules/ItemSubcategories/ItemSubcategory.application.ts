import { Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { CreateItemSubcategoryService } from './commands/CreateItemSubcategory.service';
import { EditItemSubcategoryService } from './commands/EditItemSubcategory.service';
import { DeleteItemSubcategoryService } from './commands/DeleteItemSubcategory.service';
import { GetItemSubcategoryService } from './queries/GetItemSubcategory.service';
import { GetItemSubcategoriesService } from './queries/GetItemSubcategories.service';
import {
  CreateItemSubcategoryDto,
  EditItemSubcategoryDto,
} from './dtos/ItemSubcategory.dto';
import { GetItemSubcategoriesQueryDto } from './dtos/GetItemSubcategoriesQuery.dto';

@Injectable()
export class ItemSubcategoryApplication {
  /**
   * @param {CreateItemSubcategoryService} createItemSubcategoryService
   * @param {EditItemSubcategoryService} editItemSubcategoryService
   * @param {DeleteItemSubcategoryService} deleteItemSubcategoryService
   * @param {GetItemSubcategoryService} getItemSubcategoryService
   * @param {GetItemSubcategoriesService} getItemSubcategoriesService
   */
  constructor(
    private readonly createItemSubcategoryService: CreateItemSubcategoryService,
    private readonly editItemSubcategoryService: EditItemSubcategoryService,
    private readonly deleteItemSubcategoryService: DeleteItemSubcategoryService,
    private readonly getItemSubcategoryService: GetItemSubcategoryService,
    private readonly getItemSubcategoriesService: GetItemSubcategoriesService,
  ) {}

  /**
   * Creates a new item subcategory.
   */
  public createItemSubcategory(
    subcategoryDTO: CreateItemSubcategoryDto,
    trx?: Knex.Transaction,
  ) {
    return this.createItemSubcategoryService.newItemSubcategory(
      subcategoryDTO,
      trx,
    );
  }

  /**
   * Updates an existing item subcategory.
   */
  public editItemSubcategory(
    itemSubcategoryId: number,
    subcategoryDTO: EditItemSubcategoryDto,
  ) {
    return this.editItemSubcategoryService.editItemSubcategory(
      itemSubcategoryId,
      subcategoryDTO,
    );
  }

  /**
   * Deletes an item subcategory.
   */
  public deleteItemSubcategory(itemSubcategoryId: number) {
    return this.deleteItemSubcategoryService.deleteItemSubcategory(
      itemSubcategoryId,
    );
  }

  /**
   * Retrieves an item subcategory by id.
   */
  public getItemSubcategory(itemSubcategoryId: number) {
    return this.getItemSubcategoryService.getItemSubcategory(
      itemSubcategoryId,
    );
  }

  /**
   * Retrieves the item subcategories list.
   */
  public getItemSubcategories(filterDTO: GetItemSubcategoriesQueryDto) {
    return this.getItemSubcategoriesService.getItemSubcategories(filterDTO);
  }
}
