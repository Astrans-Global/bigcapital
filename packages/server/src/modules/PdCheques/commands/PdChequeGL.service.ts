import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { PdCheque } from '../models/PdCheque.model';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { LedgerStorageService } from '@/modules/Ledger/LedgerStorage.service';
import { Ledger } from '@/modules/Ledger/Ledger';
import { ILedgerEntry } from '@/modules/Ledger/types/Ledger.types';
import { AccountNormal } from '@/interfaces/Account';
import { AccountRepository } from '@/modules/Accounts/repositories/Account.repository';
import { ServiceError } from '@/modules/Items/ServiceError';
import {
  CHEQUES_IN_HAND_SLUG,
  CUSTOMER_ADVANCES_SLUG,
  ERRORS,
  PD_CHEQUE_TX,
} from '../constants';

@Injectable()
export class PdChequeGLService {
  constructor(
    private readonly ledgerStorage: LedgerStorageService,
    private readonly accountRepository: AccountRepository,

    @Inject(PdCheque.name)
    private readonly pdChequeModel: TenantModelProxy<typeof PdCheque>,
  ) {}

  public async resolveCollectionAccounts() {
    const cheques = await this.accountRepository.findBySlug(CHEQUES_IN_HAND_SLUG);
    const advances = await this.accountRepository.findBySlug(
      CUSTOMER_ADVANCES_SLUG,
    );
    if (!cheques) {
      throw new ServiceError(
        ERRORS.CHEQUES_ACCOUNT_MISSING,
        'Cheques in hand account is missing. Run tenant migrations.',
      );
    }
    if (!advances) {
      throw new ServiceError(
        ERRORS.ADVANCES_ACCOUNT_MISSING,
        'Customer advances account is missing. Run tenant migrations.',
      );
    }
    return { cheques, advances };
  }

  public async writeReceiveEntries(chequeId: number, trx?: Knex.Transaction) {
    const cheque = await this.pdChequeModel()
      .query(trx)
      .findById(chequeId)
      .withGraphFetched('entries');

    const arAccount = await this.accountRepository.findOrCreateAccountReceivable(
      cheque.currencyCode,
    );
    const common = this.commonEntry(cheque, PD_CHEQUE_TX.RECEIVE);
    const entries: ILedgerEntry[] = [
      {
        ...common,
        debit: cheque.localAmount,
        accountId: cheque.chequesAccountId,
        index: 1,
        accountNormal: AccountNormal.DEBIT,
      },
    ];
    if (cheque.localAllocated > 0) {
      entries.push({
        ...common,
        credit: cheque.localAllocated,
        accountId: arAccount.id,
        contactId: cheque.customerId,
        index: 2,
        accountNormal: AccountNormal.DEBIT,
      });
    }
    if (cheque.localAdvance > 0) {
      entries.push({
        ...common,
        credit: cheque.localAdvance,
        accountId: cheque.advancesAccountId,
        contactId: cheque.customerId,
        index: 3,
        accountNormal: AccountNormal.CREDIT,
      });
    }
    await this.ledgerStorage.commit(new Ledger(entries), trx);
  }

  public async revertReceiveEntries(chequeId: number, trx?: Knex.Transaction) {
    await this.ledgerStorage.deleteByReference(
      chequeId,
      PD_CHEQUE_TX.RECEIVE,
      trx,
    );
  }

  public async rewriteReceiveEntries(chequeId: number, trx?: Knex.Transaction) {
    await this.revertReceiveEntries(chequeId, trx);
    await this.writeReceiveEntries(chequeId, trx);
  }

  public async writeRealizeEntries(
    chequeId: number,
    bankAccountId: number,
    realizeDate: string,
    trx?: Knex.Transaction,
  ) {
    const cheque = await this.pdChequeModel()
      .query(trx)
      .findById(chequeId)
      .withGraphFetched('entries');

    const arAccount = await this.accountRepository.findOrCreateAccountReceivable(
      cheque.currencyCode,
    );
    const common = {
      ...this.commonEntry(cheque, PD_CHEQUE_TX.REALIZE),
      date: realizeDate,
    };
    const entries: ILedgerEntry[] = [
      {
        ...common,
        debit: cheque.localAmount,
        accountId: bankAccountId,
        index: 1,
        accountNormal: AccountNormal.DEBIT,
      },
      {
        ...common,
        credit: cheque.localAmount,
        accountId: cheque.chequesAccountId,
        index: 2,
        accountNormal: AccountNormal.DEBIT,
      },
    ];
    if (cheque.localAdvance > 0) {
      entries.push(
        {
          ...common,
          debit: cheque.localAdvance,
          accountId: cheque.advancesAccountId,
          contactId: cheque.customerId,
          index: 3,
          accountNormal: AccountNormal.CREDIT,
        },
        {
          ...common,
          credit: cheque.localAdvance,
          accountId: arAccount.id,
          contactId: cheque.customerId,
          index: 4,
          accountNormal: AccountNormal.DEBIT,
        },
      );
    }
    await this.ledgerStorage.commit(new Ledger(entries), trx);
  }

  private commonEntry(cheque: PdCheque, transactionType: string) {
    return {
      debit: 0,
      credit: 0,
      currencyCode: cheque.currencyCode,
      exchangeRate: cheque.exchangeRate || 1,
      transactionId: cheque.id,
      transactionType,
      transactionNumber: cheque.chequeNo,
      referenceNumber: cheque.referenceNo,
      date: cheque.collectedDate,
      userId: cheque.userId,
      branchId: cheque.branchId,
    };
  }
}
