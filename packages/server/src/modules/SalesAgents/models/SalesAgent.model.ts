import { Model } from 'objection';
import { TenantBaseModel } from '@/modules/System/models/TenantBaseModel';
import { InjectModelMeta } from '@/modules/Tenancy/TenancyModels/decorators/InjectModelMeta.decorator';
import { SalesAgentMeta } from './SalesAgent.meta';

@InjectModelMeta(SalesAgentMeta)
export class SalesAgent extends TenantBaseModel {
  name!: string;
  cashAccountId!: number;
  active!: boolean;
  userId!: number;

  static get tableName() {
    return 'sales_agents';
  }

  get timestamps() {
    return ['createdAt', 'updatedAt'];
  }

  static get relationMappings() {
    const { Account } = require('../../Accounts/models/Account.model');
    const {
      PaymentReceived,
    } = require('../../PaymentReceived/models/PaymentReceived');

    return {
      cashAccount: {
        relation: Model.BelongsToOneRelation,
        modelClass: Account,
        join: {
          from: 'sales_agents.cashAccountId',
          to: 'accounts.id',
        },
      },
      payments: {
        relation: Model.HasManyRelation,
        modelClass: PaymentReceived,
        join: {
          from: 'sales_agents.id',
          to: 'payment_receives.agentId',
        },
      },
    };
  }
}
