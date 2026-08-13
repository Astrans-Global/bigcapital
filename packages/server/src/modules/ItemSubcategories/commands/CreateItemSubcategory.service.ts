import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Knex } from 'knex';
import { events } from '@/common/events/events';
import { UnitOfWork } from '@/modules/Tenancy/TenancyDB/UnitOfWork.service';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { TenancyContext } from '@/modules/Tenancy/TenancyContext.service';
import { ItemSubcategory } from '../models/ItemSubcategory.model';
import { CommandItemSubcategoryValidatorService } from './CommandItemSubcategoryValidator.service';
import { CreateItemSubcategoryDto } from '../dtos/ItemSubcategory.dto';
import { IItemSubcategoryCreatedPayload } from '../ItemSubcategory.interfaces';

@Injectable()
export class CreateItemSubcategoryService {
  /**
   * @param {UnitOfWork} uow - Unit of work.
   * @param {CommandItemSubcategoryValidatorService} validator - Command item subcategory validator service.
   * @param {EventEmitter2} eventEmitter - Event emitter.
   * @param {TenancyContext} tenancyContext - Tenancy context.
   * @param {typeof ItemSubcategory} itemSubcategoryModel - Item subcategory model.
   */
  constructor(
    private readonly uow: UnitOfWork,
    private readonly validator: CommandItemSubcategoryValidatorService,
    private readonly eventEmitter: EventEmitter2,
    private readonly tenancyContext: TenancyContext,

    @Inject(ItemSubcategory.name)
    private readonly itemSubcategoryModel: TenantModelProxy<
      typeof ItemSubcategory
    >,
  ) {}

  /**
   * Inserts a new item subcategory.
   * @param {CreateItemSubcategoryDto} subcategoryDTO
   * @param {Knex.Transaction} trx
   * @return {Promise<ItemSubcategory>}
   */
  public async newItemSubcategory(
    subcategoryDTO: CreateItemSubcategoryDto,
    trx?: Knex.Transaction,
  ): Promise<ItemSubcategory> {
    await this.validator.validateCategoryExistance(subcategoryDTO.categoryId);
    await this.validator.validateSubcategoryNameUniquiness(
      subcategoryDTO.name,
      subcategoryDTO.categoryId,
    );
    const authorizedUser = await this.tenancyContext.getSystemUser();

    return this.uow.withTransaction(async (trx: Knex.Transaction) => {
      const itemSubcategory = await this.itemSubcategoryModel()
        .query(trx)
        .insertAndFetch({
          ...subcategoryDTO,
          userId: authorizedUser?.id,
        });
      await this.eventEmitter.emitAsync(events.itemSubcategory.onCreated, {
        itemSubcategory,
        trx,
      } as IItemSubcategoryCreatedPayload);

      return itemSubcategory;
    }, trx);
  }
}
