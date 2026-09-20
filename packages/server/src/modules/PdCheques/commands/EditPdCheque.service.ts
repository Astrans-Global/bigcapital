import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { sumBy } from 'lodash';
import { PdCheque } from '../models/PdCheque.model';
import { SaleInvoice } from '@/modules/SaleInvoices/models/SaleInvoice';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { UnitOfWork } from '@/modules/Tenancy/TenancyDB/UnitOfWork.service';
import { ServiceError } from '@/modules/Items/ServiceError';
import { PdChequeGLService } from './PdChequeGL.service';
import { PdChequeInvoiceSync } from './PdChequeInvoiceSync.service';
import { EditPdChequeDto } from '../dtos/PdCheque.dto';
import { ERRORS, PD_CHEQUE_STATUS } from '../constants';

@Injectable()
export class EditPdChequeService {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly gl: PdChequeGLService,
    private readonly invoiceSync: PdChequeInvoiceSync,

    @Inject(PdCheque.name)
    private readonly pdChequeModel: TenantModelProxy<typeof PdCheque>,

    @Inject(SaleInvoice.name)
    private readonly saleInvoiceModel: TenantModelProxy<typeof SaleInvoice>,
  ) {}

  public async edit(chequeId: number, dto: EditPdChequeDto) {
    const oldCheque = await this.pdChequeModel()
      .query()
      .findById(chequeId)
      .withGraphFetched('entries')
      .throwIfNotFound();

    if (oldCheque.status !== PD_CHEQUE_STATUS.PENDING) {
      throw new ServiceError(
        ERRORS.EDIT_ONLY_PENDING,
        'Only pending cheques can be edited.',
      );
    }

    const entries = (dto.entries || []).filter(
      (entry) => entry.invoiceId && Number(entry.paymentAmount) > 0,
    );
    const allocatedAmount = sumBy(entries, (e) => Number(e.paymentAmount) || 0);
    const amount = Number(dto.amount);

    if (allocatedAmount > amount + 0.0001) {
      throw new ServiceError(
        ERRORS.ALLOCATED_EXCEEDS_AMOUNT,
        'Assigned invoice amounts cannot exceed the cheque amount.',
      );
    }

    if (entries.length > 0) {
      const invoiceIds = entries.map((e) => e.invoiceId);
      const invoices = await this.saleInvoiceModel()
        .query()
        .whereIn('id', invoiceIds)
        .where('customer_id', dto.customerId);
      if (invoices.length !== invoiceIds.length) {
        throw new ServiceError(ERRORS.INVOICES_IDS_NOT_FOUND);
      }
    }

    return this.uow.withTransaction(async (trx: Knex.Transaction) => {
      const cheque = await this.pdChequeModel()
        .query(trx)
        .upsertGraphAndFetch({
          id: chequeId,
          customerId: dto.customerId,
          chequeNo: dto.chequeNo,
          amount,
          allocatedAmount,
          advanceAmount: amount - allocatedAmount,
          collectedDate: dto.collectedDate,
          bankingDate: dto.bankingDate,
          exchangeRate: dto.exchangeRate || oldCheque.exchangeRate || 1,
          branchId: dto.branchId,
          referenceNo: dto.referenceNo,
          statement: dto.statement,
          entries: entries.map((entry, index) => ({
            invoiceId: entry.invoiceId,
            paymentAmount: entry.paymentAmount,
            index: entry.index || index + 1,
          })),
        });

      await this.invoiceSync.saveChangeInvoicePaymentAmount(
        cheque.entries || [],
        oldCheque.entries || [],
        trx,
      );
      await this.gl.rewriteReceiveEntries(cheque.id, trx);
      return cheque;
    });
  }
}
