import { Inject, Injectable } from '@nestjs/common';
import { PaymentReceived } from '../models/PaymentReceived';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { PAYMENT_METHODS } from '../payment-methods';

@Injectable()
export class GetCashInHandService {
  constructor(
    @Inject(PaymentReceived.name)
    private readonly paymentReceivedModel: TenantModelProxy<
      typeof PaymentReceived
    >,
  ) {}

  public async getCashInHand(query: { areaId?: number; agentId?: number }) {
    const payments = await this.paymentReceivedModel()
      .query()
      .withGraphFetched(
        '[customer.area, customer.routeCity, entries.invoice, depositAccount, agent]',
      )
      .where('paymentMethod', PAYMENT_METHODS.CASH)
      .whereNull('depositedAt')
      .onBuild((builder) => {
        if (query.agentId) {
          builder.where('agentId', query.agentId);
        }
      })
      .orderBy('paymentDate', 'desc');

    const filtered = query.areaId
      ? payments.filter(
          (row: any) => row.customer?.areaId === Number(query.areaId),
        )
      : payments;

    return filtered.flatMap((payment: any) => {
      const entries =
        payment.entries && payment.entries.length > 0
          ? payment.entries
          : [{ invoice: null, paymentAmount: payment.amount }];

      return entries.map((entry: any) => ({
        id: payment.id,
        paymentReceiveId: payment.id,
        paymentReceiveNo: payment.paymentReceiveNo,
        paymentDate: payment.paymentDate,
        amount: payment.amount,
        paymentAmount: entry.paymentAmount,
        currencyCode: payment.currencyCode,
        customerId: payment.customerId,
        customerName: payment.customer?.displayName,
        areaName: payment.customer?.area?.name,
        routeCityName: payment.customer?.routeCity?.name,
        agentId: payment.agentId,
        agentName: payment.agent?.name,
        cashAccountName: payment.depositAccount?.name,
        invoiceNo: entry.invoice?.invoiceNo,
        invoiceId: entry.invoiceId || entry.invoice?.id,
      }));
    });
  }
}
