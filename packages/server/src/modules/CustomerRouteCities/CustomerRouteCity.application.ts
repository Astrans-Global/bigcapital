import { Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { CreateCustomerRouteCityService } from './commands/CreateCustomerRouteCity.service';
import { EditCustomerRouteCityService } from './commands/EditCustomerRouteCity.service';
import { DeleteCustomerRouteCityService } from './commands/DeleteCustomerRouteCity.service';
import { GetCustomerRouteCityService } from './queries/GetCustomerRouteCity.service';
import { GetCustomerRouteCitiesService } from './queries/GetCustomerRouteCities.service';
import {
  CreateCustomerRouteCityDto,
  EditCustomerRouteCityDto,
} from './dtos/CustomerRouteCity.dto';
import { GetCustomerRouteCitiesQueryDto } from './dtos/GetCustomerRouteCitiesQuery.dto';

@Injectable()
export class CustomerRouteCityApplication {
  constructor(
    private readonly createCustomerRouteCityService: CreateCustomerRouteCityService,
    private readonly editCustomerRouteCityService: EditCustomerRouteCityService,
    private readonly deleteCustomerRouteCityService: DeleteCustomerRouteCityService,
    private readonly getCustomerRouteCityService: GetCustomerRouteCityService,
    private readonly getCustomerRouteCitiesService: GetCustomerRouteCitiesService,
  ) {}

  public createCustomerRouteCity(
    routeCityDTO: CreateCustomerRouteCityDto,
    trx?: Knex.Transaction,
  ) {
    return this.createCustomerRouteCityService.newCustomerRouteCity(
      routeCityDTO,
      trx,
    );
  }

  public editCustomerRouteCity(
    customerRouteCityId: number,
    routeCityDTO: EditCustomerRouteCityDto,
  ) {
    return this.editCustomerRouteCityService.editCustomerRouteCity(
      customerRouteCityId,
      routeCityDTO,
    );
  }

  public deleteCustomerRouteCity(customerRouteCityId: number) {
    return this.deleteCustomerRouteCityService.deleteCustomerRouteCity(
      customerRouteCityId,
    );
  }

  public getCustomerRouteCity(customerRouteCityId: number) {
    return this.getCustomerRouteCityService.getCustomerRouteCity(
      customerRouteCityId,
    );
  }

  public getCustomerRouteCities(filterDTO: GetCustomerRouteCitiesQueryDto) {
    return this.getCustomerRouteCitiesService.getCustomerRouteCities(
      filterDTO,
    );
  }
}
