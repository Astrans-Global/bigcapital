import { Inject, Injectable } from '@nestjs/common';
import { Customer } from '../models/Customer';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { CustomerDueInvoicesService } from '../queries/CustomerDueInvoices.service';

/**
 * Writes the live A/B/C/D grade onto `contacts.risk_category`. No journals —
 * this is an ops label only. See docs/ops/PHASE1.md ("Customers").
 */
@Injectable()
export class RecalculateCustomerRiskService {
  constructor(
    private readonly customerDueInvoices: CustomerDueInvoicesService,

    @Inject(Customer.name)
    private readonly customerModel: TenantModelProxy<typeof Customer>,
  ) {}

  public async recalculateAllCustomers(): Promise<{
    updated: number;
    total: number;
  }> {
    const snapshots =
      await this.customerDueInvoices.getSnapshotsForAllCustomers();
    let updated = 0;

    for (const snapshot of snapshots) {
      if (snapshot.storedRiskCategory === snapshot.riskCategory) {
        continue;
      }
      await this.customerModel()
        .query()
        .findById(snapshot.customerId)
        .patch({ riskCategory: snapshot.riskCategory });
      updated += 1;
    }

    return { updated, total: snapshots.length };
  }
}
