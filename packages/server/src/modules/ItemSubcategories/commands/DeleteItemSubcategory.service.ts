import { Knex } from 'knex';
import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { events } from '@/common/events/events';
import { UnitOfWork } from '@/modules/Tenancy/TenancyDB/UnitOfWork.service';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { Item } from '@/modules/Items/models/Item';
import { ItemSubcategory } from '../models/ItemSubcategory.model';
import { IItemSubcategoryDeletedPayload } from '../ItemSubcategory.interfaces';

@Injectable()
export class DeleteItemSubcategoryService {
  /**
   * @param {UnitOfWork} uow - Unit of work.
   * @param {EventEmitter2} eventEmitter - Event emitter.
   * @param {typeof ItemSubcategory} itemSubcategoryModel - Item subcategory model.
   * @param {typeof Item} itemModel - Item model.
   */
  constructor(
    private readonly uow: UnitOfWork,
    private readonly eventEmitter: EventEmitter2,

    @Inject(ItemSubcategory.name)
    private readonly itemSubcategoryModel: TenantModelProxy<
      typeof ItemSubcategory
    >,

    @Inject(Item.name)
    private readonly itemModel: TenantModelProxy<typeof Item>,
  ) {}

  /**
   * Deletes the given item subcategory.
   * @param {number} itemSubcategoryId
   * @param {Knex.Transaction} trx
   * @return {Promise<void>}
   */
  public async deleteItemSubcategory(
    itemSubcategoryId: number,
    trx?: Knex.Transaction,
  ) {
    const oldItemSubcategory = await this.itemSubcategoryModel()
      .query()
      .findById(itemSubcategoryId)
      .throwIfNotFound();

    return this.uow.withTransaction(async (trx: Knex.Transaction) => {
      // Unassociate items with the subcategory before deleting it.
      await this.itemModel()
        .query(trx)
        .where('subcategory_id', itemSubcategoryId)
        .patch({ subcategoryId: null });

      await this.itemSubcategoryModel()
        .query(trx)
        .findById(itemSubcategoryId)
        .delete();

      await this.eventEmitter.emitAsync(events.itemSubcategory.onDeleted, {
        itemSubcategoryId,
        oldItemSubcategory,
      } as IItemSubcategoryDeletedPayload);
    }, trx);
  }
}
