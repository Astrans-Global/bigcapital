import { Module } from '@nestjs/common';
import { TenancyDatabaseModule } from '../Tenancy/TenancyDB/TenancyDB.module';
import { TenancyModule } from '../Tenancy/Tenancy.module';
import { CustomerAreaController } from './CustomerArea.controller';
import { CustomerAreaApplication } from './CustomerArea.application';
import { CreateCustomerAreaService } from './commands/CreateCustomerArea.service';
import { EditCustomerAreaService } from './commands/EditCustomerArea.service';
import { DeleteCustomerAreaService } from './commands/DeleteCustomerArea.service';
import { CommandCustomerAreaValidatorService } from './commands/CommandCustomerAreaValidator.service';
import { GetCustomerAreaService } from './queries/GetCustomerArea.service';
import { GetCustomerAreasService } from './queries/GetCustomerAreas.service';

@Module({
  imports: [TenancyModule, TenancyDatabaseModule],
  controllers: [CustomerAreaController],
  providers: [
    CreateCustomerAreaService,
    EditCustomerAreaService,
    DeleteCustomerAreaService,
    GetCustomerAreaService,
    GetCustomerAreasService,
    CommandCustomerAreaValidatorService,
    CustomerAreaApplication,
  ],
  exports: [CustomerAreaApplication],
})
export class CustomerAreaModule {}
