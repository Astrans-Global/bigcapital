import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Knex } from 'knex';
import { events } from '@/common/events/events';
import { UnitOfWork } from '@/modules/Tenancy/TenancyDB/UnitOfWork.service';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { ItemSubcategory } from '../models/ItemSubcategory.model';
import { CommandItemSubcategoryValidatorService } from './CommandItemSubcategoryValidator.service';
import { EditItemSubcategoryDto } from '../dtos/ItemSubcategory.dto';
import { IItemSubcategoryEditedPayload } from '../ItemSubcategory.interfaces';

@Injectable()
export class EditItemSubcategoryService {
  /**
   * @param {UnitOfWork} uow - Unit of work.
   * @param {CommandItemSubcategoryValidatorService} validator - Command item subcategory validator service.
   * @param {EventEmitter2} eventEmitter - Event emitter.
   * @param {typeof ItemSubcategory} itemSubcategoryModel - Item subcategory model.
   */
  constructor(
    private readonly uow: UnitOfWork,
    private readonly validator: CommandItemSubcategoryValidatorService,
    private readonly eventEmitter: EventEmitter2,

    @Inject(ItemSubcategory.name)
    private readonly itemSubcategoryModel: TenantModelProxy<
      typeof ItemSubcategory
    >,
  ) {}

  /**
   * Edits the given item subcategory.
   * @param {number} itemSubcategoryId
   * @param {EditItemSubcategoryDto} subcategoryDTO
   * @return {Promise<ItemSubcategory>}
   */
  public async editItemSubcategory(
    itemSubcategoryId: number,
    subcategoryDTO: EditItemSubcategoryDto,
  ): Promise<ItemSubcategory> {
    const oldItemSubcategory = await this.itemSubcategoryModel()
      .query()
      .findById(itemSubcategoryId)
      .throwIfNotFound();

    await this.validator.validateCategoryExistance(subcategoryDTO.categoryId);
    await this.validator.validateSubcategoryNameUniquiness(
      subcategoryDTO.name,
      subcategoryDTO.categoryId,
      itemSubcategoryId,
    );
    return this.uow.withTransaction(async (trx: Knex.Transaction) => {
      const itemSubcategory = await this.itemSubcategoryModel()
        .query(trx)
        .patchAndFetchById(itemSubcategoryId, { ...subcategoryDTO });

      await this.eventEmitter.emitAsync(events.itemSubcategory.onEdited, {
        oldItemSubcategory,
        itemSubcategory,
        trx,
      } as IItemSubcategoryEditedPayload);

      return itemSubcategory;
    });
  }
}
