import { Inject, Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ClsService } from 'nestjs-cls';
import { TenantModel } from '@/modules/System/models/TenantModel';
import { RecalculateCustomerRiskService } from '../commands/RecalculateCustomerRisk.service';

/**
 * Once a day (02:00 Asia/Colombo) rewrite every customer's stored
 * `risk_category` from current unpaid Delivered invoices. Invoice form /
 * Delivery Prep compute the same grade live, so the screen is never a day
 * behind; this job keeps the column on `contacts` in step for lists.
 */
@Injectable()
export class RecalculateCustomerRiskJob {
  constructor(
    private readonly cls: ClsService,
    private readonly recalculateCustomerRisk: RecalculateCustomerRiskService,

    @Inject(TenantModel.name)
    private readonly tenantModel: typeof TenantModel,
  ) {}

  @Cron('0 2 * * *', { timeZone: 'Asia/Colombo' })
  async recalculateCustomerRiskJob() {
    const tenants = await this.tenantModel
      .query()
      .whereNotNull('initializedAt')
      .whereNotNull('seededAt')
      .where('isInactive', false)
      .where('isDeleting', false);

    for (const tenant of tenants) {
      try {
        await this.cls.run(async () => {
          this.cls.set('organizationId', tenant.organizationId);
          const result =
            await this.recalculateCustomerRisk.recalculateAllCustomers();
          console.log(
            `Customer risk recalc for ${tenant.organizationId}: ${result.updated}/${result.total} updated.`,
          );
        });
      } catch (error) {
        console.error(
          `Customer risk recalc failed for ${tenant.organizationId}`,
          error,
        );
      }
    }
  }
}
