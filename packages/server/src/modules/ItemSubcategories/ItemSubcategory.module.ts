import { Module } from '@nestjs/common';
import { TenancyDatabaseModule } from '../Tenancy/TenancyDB/TenancyDB.module';
import { TenancyModule } from '../Tenancy/Tenancy.module';
import { ItemSubcategoryController } from './ItemSubcategory.controller';
import { ItemSubcategoryApplication } from './ItemSubcategory.application';
import { CreateItemSubcategoryService } from './commands/CreateItemSubcategory.service';
import { EditItemSubcategoryService } from './commands/EditItemSubcategory.service';
import { DeleteItemSubcategoryService } from './commands/DeleteItemSubcategory.service';
import { CommandItemSubcategoryValidatorService } from './commands/CommandItemSubcategoryValidator.service';
import { GetItemSubcategoryService } from './queries/GetItemSubcategory.service';
import { GetItemSubcategoriesService } from './queries/GetItemSubcategories.service';

@Module({
  imports: [TenancyModule, TenancyDatabaseModule],
  controllers: [ItemSubcategoryController],
  providers: [
    CreateItemSubcategoryService,
    EditItemSubcategoryService,
    DeleteItemSubcategoryService,
    GetItemSubcategoryService,
    GetItemSubcategoriesService,
    CommandItemSubcategoryValidatorService,
    ItemSubcategoryApplication,
  ],
})
export class ItemSubcategoryModule {}
