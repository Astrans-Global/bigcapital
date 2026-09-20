import { Injectable } from '@nestjs/common';
import { AutoIncrementOrdersService } from '@/modules/AutoIncrementOrders/AutoIncrementOrders.service';

export const PD_CHEQUE_NUMBER_GROUP = 'pd_cheques';

export function chequeAreaLetter(areaName?: string | null): string {
  const match = String(areaName || '').match(/[A-Za-z]/);
  return (match ? match[0] : 'X').toUpperCase();
}

@Injectable()
export class PdChequeIncrementService {
  constructor(
    private readonly autoIncrementOrdersService: AutoIncrementOrdersService,
  ) {}

  public groupForArea(areaName?: string | null): string {
    return `${PD_CHEQUE_NUMBER_GROUP}_${chequeAreaLetter(areaName)}`;
  }

  public async getNextDocumentNo(areaName?: string | null): Promise<string> {
    const letter = chequeAreaLetter(areaName);
    const group = this.groupForArea(areaName);
    await this.autoIncrementOrdersService.ensureGroup(group, {
      prefix: `CH${letter}-`,
      suffix: '',
      next: '000001',
    });
    return this.autoIncrementOrdersService.peekNumber(group);
  }

  public incrementDocumentNo(areaName?: string | null) {
    return this.autoIncrementOrdersService.bumpNumber(
      this.groupForArea(areaName),
    );
  }
}
