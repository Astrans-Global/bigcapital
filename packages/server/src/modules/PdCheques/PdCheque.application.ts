import { Injectable } from '@nestjs/common';
import { CreatePdChequeService } from './commands/CreatePdCheque.service';
import { EditPdChequeService } from './commands/EditPdCheque.service';
import { DeletePdChequeService } from './commands/DeletePdCheque.service';
import { PdChequeStatusService } from './commands/PdChequeStatus.service';
import { GetPdChequesService } from './queries/GetPdCheques.service';
import {
  CreatePdChequeDto,
  EditPdChequeDto,
  GetPdChequesQueryDto,
} from './dtos/PdCheque.dto';

@Injectable()
export class PdChequeApplication {
  constructor(
    private readonly createService: CreatePdChequeService,
    private readonly editService: EditPdChequeService,
    private readonly deleteService: DeletePdChequeService,
    private readonly statusService: PdChequeStatusService,
    private readonly getService: GetPdChequesService,
  ) {}

  create(dto: CreatePdChequeDto) {
    return this.createService.create(dto);
  }

  edit(id: number, dto: EditPdChequeDto) {
    return this.editService.edit(id, dto);
  }

  delete(id: number) {
    return this.deleteService.delete(id);
  }

  getCheques(query: GetPdChequesQueryDto) {
    return this.getService.getCheques(query);
  }

  toXlsx(query: GetPdChequesQueryDto) {
    return this.getService.toXlsx(query);
  }

  toPdf(query: GetPdChequesQueryDto) {
    return this.getService.toPdf(query);
  }

  markDeposited(id: number, bankAccountId: number) {
    return this.statusService.markDeposited(id, bankAccountId);
  }

  markRealized(id: number, bankAccountId: number, realizeDate?: string) {
    return this.statusService.markRealized(id, bankAccountId, realizeDate);
  }

  markReturned(id: number) {
    return this.statusService.markReturned(id);
  }
}
