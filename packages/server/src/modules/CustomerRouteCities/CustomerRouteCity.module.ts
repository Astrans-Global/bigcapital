import { Module } from '@nestjs/common';
import { TenancyDatabaseModule } from '../Tenancy/TenancyDB/TenancyDB.module';
import { TenancyModule } from '../Tenancy/Tenancy.module';
import { CustomerRouteCityController } from './CustomerRouteCity.controller';
import { CustomerRouteCityApplication } from './CustomerRouteCity.application';
import { CreateCustomerRouteCityService } from './commands/CreateCustomerRouteCity.service';
import { EditCustomerRouteCityService } from './commands/EditCustomerRouteCity.service';
import { DeleteCustomerRouteCityService } from './commands/DeleteCustomerRouteCity.service';
import { CommandCustomerRouteCityValidatorService } from './commands/CommandCustomerRouteCityValidator.service';
import { GetCustomerRouteCityService } from './queries/GetCustomerRouteCity.service';
import { GetCustomerRouteCitiesService } from './queries/GetCustomerRouteCities.service';

@Module({
  imports: [TenancyModule, TenancyDatabaseModule],
  controllers: [CustomerRouteCityController],
  providers: [
    CreateCustomerRouteCityService,
    EditCustomerRouteCityService,
    DeleteCustomerRouteCityService,
    GetCustomerRouteCityService,
    GetCustomerRouteCitiesService,
    CommandCustomerRouteCityValidatorService,
    CustomerRouteCityApplication,
  ],
  exports: [CustomerRouteCityApplication],
})
export class CustomerRouteCityModule {}
