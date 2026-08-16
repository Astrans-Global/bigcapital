import { Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { CreateCustomerAreaService } from './commands/CreateCustomerArea.service';
import { EditCustomerAreaService } from './commands/EditCustomerArea.service';
import { DeleteCustomerAreaService } from './commands/DeleteCustomerArea.service';
import { GetCustomerAreaService } from './queries/GetCustomerArea.service';
import { GetCustomerAreasService } from './queries/GetCustomerAreas.service';
import {
  CreateCustomerAreaDto,
  EditCustomerAreaDto,
} from './dtos/CustomerArea.dto';

@Injectable()
export class CustomerAreaApplication {
  constructor(
    private readonly createCustomerAreaService: CreateCustomerAreaService,
    private readonly editCustomerAreaService: EditCustomerAreaService,
    private readonly deleteCustomerAreaService: DeleteCustomerAreaService,
    private readonly getCustomerAreaService: GetCustomerAreaService,
    private readonly getCustomerAreasService: GetCustomerAreasService,
  ) {}

  public createCustomerArea(
    areaDTO: CreateCustomerAreaDto,
    trx?: Knex.Transaction,
  ) {
    return this.createCustomerAreaService.newCustomerArea(areaDTO, trx);
  }

  public editCustomerArea(
    customerAreaId: number,
    areaDTO: EditCustomerAreaDto,
  ) {
    return this.editCustomerAreaService.editCustomerArea(
      customerAreaId,
      areaDTO,
    );
  }

  public deleteCustomerArea(customerAreaId: number) {
    return this.deleteCustomerAreaService.deleteCustomerArea(customerAreaId);
  }

  public getCustomerArea(customerAreaId: number) {
    return this.getCustomerAreaService.getCustomerArea(customerAreaId);
  }

  public getCustomerAreas() {
    return this.getCustomerAreasService.getCustomerAreas();
  }
}
