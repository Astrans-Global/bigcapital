import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { PdCheque } from '../models/PdCheque.model';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { UnitOfWork } from '@/modules/Tenancy/TenancyDB/UnitOfWork.service';
import { ServiceError } from '@/modules/Items/ServiceError';
import { PdChequeGLService } from './PdChequeGL.service';
import { PdChequeInvoiceSync } from './PdChequeInvoiceSync.service';
import { ERRORS, PD_CHEQUE_STATUS } from '../constants';

@Injectable()
export class DeletePdChequeService {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly gl: PdChequeGLService,
    private readonly invoiceSync: PdChequeInvoiceSync,

    @Inject(PdCheque.name)
    private readonly pdChequeModel: TenantModelProxy<typeof PdCheque>,
  ) {}

  public async delete(chequeId: number) {
    const cheque = await this.pdChequeModel()
      .query()
      .findById(chequeId)
      .withGraphFetched('entries')
      .throwIfNotFound();

    if (cheque.status !== PD_CHEQUE_STATUS.PENDING) {
      throw new ServiceError(
        ERRORS.EDIT_ONLY_PENDING,
        'Only pending cheques can be deleted.',
      );
    }

    return this.uow.withTransaction(async (trx: Knex.Transaction) => {
      await this.invoiceSync.saveChangeInvoicePaymentAmount(
        (cheque.entries || []).map((entry) => ({
          ...entry,
          paymentAmount: 0,
        })),
        cheque.entries || [],
        trx,
      );
      await this.gl.revertReceiveEntries(chequeId, trx);
      await trx('pd_cheque_entries').where('pd_cheque_id', chequeId).delete();
      await this.pdChequeModel().query(trx).deleteById(chequeId);
    });
  }
}
