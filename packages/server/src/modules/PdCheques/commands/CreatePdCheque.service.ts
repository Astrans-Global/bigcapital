import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { sumBy } from 'lodash';
import { PdCheque } from '../models/PdCheque.model';
import { Customer } from '@/modules/Customers/models/Customer';
import { SaleInvoice } from '@/modules/SaleInvoices/models/SaleInvoice';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { UnitOfWork } from '@/modules/Tenancy/TenancyDB/UnitOfWork.service';
import { TenancyContext } from '@/modules/Tenancy/TenancyContext.service';
import { ServiceError } from '@/modules/Items/ServiceError';
import { PdChequeGLService } from './PdChequeGL.service';
import { PdChequeInvoiceSync } from './PdChequeInvoiceSync.service';
import { PdChequeIncrementService } from './PdChequeIncrement.service';
import { CreatePdChequeDto } from '../dtos/PdCheque.dto';
import { ERRORS, PD_CHEQUE_STATUS } from '../constants';

@Injectable()
export class CreatePdChequeService {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly tenancyContext: TenancyContext,
    private readonly gl: PdChequeGLService,
    private readonly invoiceSync: PdChequeInvoiceSync,
    private readonly increment: PdChequeIncrementService,

    @Inject(PdCheque.name)
    private readonly pdChequeModel: TenantModelProxy<typeof PdCheque>,

    @Inject(Customer.name)
    private readonly customerModel: TenantModelProxy<typeof Customer>,

    @Inject(SaleInvoice.name)
    private readonly saleInvoiceModel: TenantModelProxy<typeof SaleInvoice>,
  ) {}

  public async create(dto: CreatePdChequeDto) {
    const customer = await this.customerModel()
      .query()
      .findById(dto.customerId)
      .withGraphFetched('area')
      .throwIfNotFound();

    const entries = (dto.entries || []).filter(
      (entry) => entry.invoiceId && Number(entry.paymentAmount) > 0,
    );
    const allocatedAmount = sumBy(entries, (e) => Number(e.paymentAmount) || 0);
    const amount = Number(dto.amount);

    if (!(amount > 0)) {
      throw new ServiceError(
        ERRORS.INVALID_CHEQUE_AMOUNT,
        'Cheque amount must be greater than zero.',
      );
    }
    if (!dto.chequeNo) {
      throw new ServiceError(ERRORS.CHEQUE_NO_REQUIRED, 'Enter the cheque number.');
    }
    if (!dto.bankingDate) {
      throw new ServiceError(
        ERRORS.BANKING_DATE_REQUIRED,
        'Enter the banking date.',
      );
    }
    if (allocatedAmount > amount + 0.0001) {
      throw new ServiceError(
        ERRORS.ALLOCATED_EXCEEDS_AMOUNT,
        'Assigned invoice amounts cannot exceed the cheque amount.',
      );
    }
    await this.validateInvoiceAllocations(dto.customerId, entries);

    const { cheques, advances } = await this.gl.resolveCollectionAccounts();
    const user = await this.tenancyContext.getSystemUser();
    const areaName = (customer as any).area?.name;
    const documentNo = await this.increment.getNextDocumentNo(areaName);
    if (!documentNo) {
      throw new ServiceError(
        ERRORS.DOCUMENT_NO_REQUIRED,
        'Could not assign a cheque document number.',
      );
    }

    return this.uow.withTransaction(async (trx: Knex.Transaction) => {
      const cheque = await this.pdChequeModel()
        .query(trx)
        .insertGraphAndFetch({
          customerId: dto.customerId,
          chequeNo: dto.chequeNo,
          documentNo,
          amount,
          allocatedAmount,
          advanceAmount: amount - allocatedAmount,
          collectedDate: dto.collectedDate,
          bankingDate: dto.bankingDate,
          status: PD_CHEQUE_STATUS.PENDING,
          currencyCode: customer.currencyCode,
          exchangeRate: dto.exchangeRate || 1,
          branchId: dto.branchId,
          userId: user?.id,
          referenceNo: dto.referenceNo,
          statement: dto.statement,
          chequesAccountId: Number((cheques as { id: number }).id),
          advancesAccountId: Number((advances as { id: number }).id),
          entries: entries.map((entry, index) => ({
            invoiceId: entry.invoiceId,
            paymentAmount: entry.paymentAmount,
            index: entry.index || index + 1,
          })),
        });

      await this.gl.writeReceiveEntries(cheque.id, trx);
      await this.invoiceSync.saveChangeInvoicePaymentAmount(
        cheque.entries || [],
        null,
        trx,
      );
      await this.increment.incrementDocumentNo(areaName);
      return cheque;
    });
  }

  private async validateInvoiceAllocations(
    customerId: number,
    entries: { invoiceId: number; paymentAmount: number }[],
  ) {
    if (entries.length === 0) {
      return;
    }
    const invoiceIds = entries.map((e) => e.invoiceId);
    const invoices = await this.saleInvoiceModel()
      .query()
      .whereIn('id', invoiceIds)
      .where('customer_id', customerId);

    if (invoices.length !== invoiceIds.length) {
      throw new ServiceError(
        ERRORS.INVOICES_IDS_NOT_FOUND,
        'One or more invoices were not found for this customer.',
      );
    }
    const dueById = new Map(invoices.map((inv) => [inv.id, Number(inv.dueAmount)]));
    entries.forEach((entry) => {
      const due = dueById.get(entry.invoiceId) || 0;
      if (Number(entry.paymentAmount) > due + 0.0001) {
        throw new ServiceError(
          ERRORS.INVALID_PAYMENT_AMOUNT,
          'A line amount is greater than the invoice due.',
        );
      }
    });
  }
}
