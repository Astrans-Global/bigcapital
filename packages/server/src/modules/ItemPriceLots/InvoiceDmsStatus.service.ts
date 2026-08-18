import { Inject, Injectable } from '@nestjs/common';
import { SaleInvoice } from '../SaleInvoices/models/SaleInvoice';
import { DeliverSaleInvoice } from '../SaleInvoices/commands/DeliverSaleInvoice.service';
import { InvoiceLotReservationService } from './InvoiceLotReservation.service';
import { GenerateSaleInvoiceNumberService } from './GenerateSaleInvoiceNumber.service';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { UnitOfWork } from '@/modules/Tenancy/TenancyDB/UnitOfWork.service';
import { ServiceError } from '@/modules/Items/ServiceError';
import { DmsStatus, ERRORS } from './ItemPriceLots.constants';

// Statuses at (or past) this point in the pipeline hold stock aside --
// see docs/ops/PHASE1.md ("Status pipeline"). Only "pending" is a
// no-hold state.
const HOLD_STATUSES: DmsStatus[] = ['reserved', 'invoiced', 'delivered'];

/**
 * Moves a sale invoice through the Astrans DMS status pipeline (Pending ->
 * Reserved -> Invoiced -> Delivered), holding/releasing item price-lot
 * stock as needed and, for Delivered, driving Bigcapital's own native
 * deliver action so GL and inventory post exactly the way they already do
 * for every other sale invoice -- see docs/ops/PHASE1.md
 * ("Status pipeline").
 */
@Injectable()
export class InvoiceDmsStatusService {
  constructor(
    @Inject(SaleInvoice.name)
    private readonly saleInvoiceModel: TenantModelProxy<typeof SaleInvoice>,

    private readonly reservationService: InvoiceLotReservationService,
    private readonly deliverSaleInvoice: DeliverSaleInvoice,
    private readonly numberService: GenerateSaleInvoiceNumberService,
    private readonly uow: UnitOfWork,
  ) {}

  /**
   * @param {number} invoiceId - Sale invoice id.
   * @param {DmsStatus} targetStatus - Status to move the invoice to.
   */
  public async setStatus(
    invoiceId: number,
    targetStatus: DmsStatus,
  ): Promise<SaleInvoice> {
    const invoice = await this.saleInvoiceModel()
      .query()
      .findById(invoiceId)
      .throwIfNotFound();

    if (invoice.dmsStatus === 'delivered') {
      throw new ServiceError(
        ERRORS.INVOICE_ALREADY_DELIVERED,
        'This invoice has already been delivered and posted to the ' +
          'accounts -- its status can no longer be changed here.',
      );
    }

    // Reverting out of Invoiced back down to Pending/Reserved burns
    // whatever number it was carrying -- see docs/ops/PHASE1.md
    // ("Invoice numbers"). Invoiced -> Invoiced (no-op) and
    // Invoiced -> Delivered both keep the existing number instead.
    const isRevertingFromInvoiced =
      invoice.dmsStatus === 'invoiced' &&
      targetStatus !== 'invoiced' &&
      targetStatus !== 'delivered';

    if (targetStatus === 'delivered') {
      // Make sure stock is actually held (covers the case of moving
      // straight from Pending to Delivered) before committing to the
      // native deliver action, which posts GL/inventory immediately.
      // `InvoiceLotReservationSyncSubscriber` consumes the hold and syncs
      // `dms_status` once the resulting `onSaleInvoiceDelivered` event fires.
      //
      // Deliberately two separate transactions: `deliverSaleInvoice`
      // always opens its own (it has no way to accept an outer one), so
      // there's no atomicity to gain by nesting -- only fail-fast value,
      // which holding the reservation check first already gives us.
      await this.uow.withTransaction(async (trx) => {
        await this.reservationService.reserveForInvoice(invoiceId, trx);
        // Covers skipping straight from Pending/Reserved to Delivered --
        // an invoice that already reached Invoiced keeps its number.
        await this.numberService.assignNumberIfMissing(invoiceId, trx);
      });
      await this.deliverSaleInvoice.deliverSaleInvoice(invoiceId);
    } else if (HOLD_STATUSES.includes(targetStatus)) {
      await this.uow.withTransaction(async (trx) => {
        await this.reservationService.reserveForInvoice(invoiceId, trx);

        if (targetStatus === 'invoiced') {
          await this.numberService.assignNumberIfMissing(invoiceId, trx);
        } else if (isRevertingFromInvoiced) {
          await this.numberService.burnNumber(invoiceId, trx);
        }

        await this.saleInvoiceModel()
          .query(trx)
          .where('id', invoiceId)
          .patch({ dmsStatus: targetStatus } as Partial<SaleInvoice>);
      });
    } else {
      await this.uow.withTransaction(async (trx) => {
        await this.reservationService.releaseForInvoice(invoiceId, trx);

        if (isRevertingFromInvoiced) {
          await this.numberService.burnNumber(invoiceId, trx);
        }

        await this.saleInvoiceModel()
          .query(trx)
          .where('id', invoiceId)
          .patch({ dmsStatus: targetStatus } as Partial<SaleInvoice>);
      });
    }

    return this.saleInvoiceModel()
      .query()
      .findById(invoiceId)
      .withGraphFetched('entries');
  }
}
