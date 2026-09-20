import { Inject, Injectable } from '@nestjs/common';
import { kebabCase } from 'lodash';
import { Knex } from 'knex';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { TenancyContext } from '@/modules/Tenancy/TenancyContext.service';
import { Account } from '@/modules/Accounts/models/Account.model';
import { ServiceError } from '@/modules/Items/ServiceError';
import { ACCOUNT_TYPE } from '@/constants/accounts';
import { ERRORS, UNDEPOSITED_FUNDS_SLUG } from '../constants';

@Injectable()
export class SalesAgentCashAccountService {
  constructor(
    @Inject(Account.name)
    private readonly accountModel: TenantModelProxy<typeof Account>,
    private readonly tenancyContext: TenancyContext,
  ) {}

  public cashAccountName(agentName: string) {
    return `Cash in hand — ${agentName}`;
  }

  public async getUndepositedFundsOrThrow(trx?: Knex.Transaction) {
    const undeposited = await this.accountModel()
      .query(trx)
      .findOne('slug', UNDEPOSITED_FUNDS_SLUG);

    if (!undeposited) {
      throw new ServiceError(
        ERRORS.UNDEPOSITED_FUNDS_NOT_FOUND,
        'Undeposited Funds account was not found on the chart of accounts.',
      );
    }
    return undeposited;
  }

  public async createCashAccount(
    agentId: number,
    agentName: string,
    trx?: Knex.Transaction,
  ) {
    const parent = await this.getUndepositedFundsOrThrow(trx);
    const tenant = await this.tenancyContext.getTenant(true);

    return this.accountModel()
      .query(trx)
      .insertAndFetch({
        name: this.cashAccountName(agentName),
        slug: `cash-in-hand-agent-${agentId}`,
        accountType: ACCOUNT_TYPE.CASH,
        parentAccountId: parent.id,
        currencyCode: tenant.metadata.baseCurrency,
        active: parent.active,
        predefined: false,
      });
  }

  public async renameCashAccount(
    cashAccountId: number,
    agentName: string,
    trx?: Knex.Transaction,
  ) {
    const name = this.cashAccountName(agentName);
    return this.accountModel()
      .query(trx)
      .patchAndFetchById(cashAccountId, {
        name,
        slug: kebabCase(name) || `cash-in-hand-agent-${cashAccountId}`,
      });
  }

  public async inactivateCashAccount(
    cashAccountId: number,
    trx?: Knex.Transaction,
  ) {
    await this.accountModel()
      .query(trx)
      .findById(cashAccountId)
      .patch({ active: false });
  }
}
