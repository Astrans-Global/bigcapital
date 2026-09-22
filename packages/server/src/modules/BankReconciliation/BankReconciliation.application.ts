import { Injectable } from '@nestjs/common';
import { CreateBankReconciliationService } from './commands/CreateBankReconciliation.service';
import { SaveBankReconciliationDraftService } from './commands/SaveBankReconciliationDraft.service';
import { CloseBankReconciliationService } from './commands/CloseBankReconciliation.service';
import { ReopenBankReconciliationService } from './commands/ReopenBankReconciliation.service';
import { DeleteBankReconciliationService } from './commands/DeleteBankReconciliation.service';
import { GetBankReconciliationsService } from './queries/GetBankReconciliations.service';
import { GetBankReconciliationService } from './queries/GetBankReconciliation.service';
import { GetBankReconciliationEligibilityService } from './queries/GetBankReconciliationEligibility.service';
import {
  CreateBankReconciliationDto,
  SaveBankReconciliationDraftDto,
} from './dtos/BankReconciliation.dto';

@Injectable()
export class BankReconciliationApplication {
  constructor(
    private readonly createService: CreateBankReconciliationService,
    private readonly saveService: SaveBankReconciliationDraftService,
    private readonly closeService: CloseBankReconciliationService,
    private readonly reopenService: ReopenBankReconciliationService,
    private readonly deleteService: DeleteBankReconciliationService,
    private readonly listService: GetBankReconciliationsService,
    private readonly getService: GetBankReconciliationService,
    private readonly eligibilityService: GetBankReconciliationEligibilityService,
  ) {}

  create(dto: CreateBankReconciliationDto) {
    return this.createService.create(dto);
  }

  save(id: number, dto: SaveBankReconciliationDraftDto) {
    return this.saveService.save(id, dto);
  }

  close(id: number, dto?: SaveBankReconciliationDraftDto) {
    return this.closeService.close(id, dto);
  }

  reopen(id: number) {
    return this.reopenService.reopen(id);
  }

  delete(id: number) {
    return this.deleteService.delete(id);
  }

  list(accountId?: number) {
    return this.listService.list(accountId);
  }

  get(id: number, hideAfterStatementDate = true) {
    return this.getService.get(id, hideAfterStatementDate);
  }

  eligibility(accountId?: number, startDate?: string) {
    return this.eligibilityService.get(accountId, startDate);
  }
}
