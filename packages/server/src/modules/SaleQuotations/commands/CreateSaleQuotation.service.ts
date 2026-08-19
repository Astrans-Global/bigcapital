import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import * as composeAsync from 'async/compose';
import * as R from 'ramda';
import { omit } from 'lodash';
import { SaleQuotation } from '../models/SaleQuotation';
import { CreateSaleQuotationDto } from '../dtos/SaleQuotation.dto';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { UnitOfWork } from '@/modules/Tenancy/TenancyDB/UnitOfWork.service';
import { ItemsEntriesService } from '@/modules/Items/ItemsEntries.service';
import { ItemEntriesTaxTransactions } from '@/modules/TaxRates/ItemEntriesTaxTransactions.service';
import { assocItemEntriesDefaultIndex } from '@/utils/associate-item-entries-index';
import { formatDateFields } from '@/utils/format-date-fields';
import { computeSaleInvoiceVatAfterDiscount } from '@/modules/SaleInvoices/ComputeSaleInvoiceVat';
import { DiscountType } from '@/common/types/Discount';
import { BranchTransactionDTOTransformer } from '@/modules/Branches/integrations/BranchTransactionDTOTransform';
import { WarehouseTransactionDTOTransform } from '@/modules/Warehouses/Integrations/WarehouseTransactionDTOTransform';
import { TenancyContext } from '@/modules/Tenancy/TenancyContext.service';
import { SaleQuotationIncrement } from './SaleQuotationIncrement.service';

@Injectable()
export class CreateSaleQuotation {
  constructor(
    @Inject(SaleQuotation.name)
    private readonly saleQuotationModel: TenantModelProxy<typeof SaleQuotation>,

    private readonly itemsEntriesService: ItemsEntriesService,
    private readonly taxDTOTransformer: ItemEntriesTaxTransactions,
    private readonly branchDTOTransform: BranchTransactionDTOTransformer,
    private readonly warehouseDTOTransform: WarehouseTransactionDTOTransform,
    private readonly tenancyContext: TenancyContext,
    private readonly increment: SaleQuotationIncrement,
    private readonly uow: UnitOfWork,
  ) {}

  public async createQuotation(
    dto: CreateSaleQuotationDto,
  ): Promise<SaleQuotation> {
    await this.itemsEntriesService.validateItemsIdsExistance(dto.entries);
    await this.itemsEntriesService.validateNonSellableEntriesItems(dto.entries);

    return this.uow.withTransaction(async (trx: Knex.Transaction) => {
      const quotationNumber = await this.increment.allocateNextNumber(trx);
      const model = await this.toModel(dto, quotationNumber);
      const user = await this.tenancyContext.getSystemUser();
      return this.saleQuotationModel()
        .query(trx)
        .upsertGraphAndFetch({
          ...model,
          userId: user?.id,
        });
    });
  }

  public async toModel(
    dto: CreateSaleQuotationDto,
    quotationNumber: string,
  ): Promise<Partial<SaleQuotation>> {
    const amount = this.itemsEntriesService.getTotalItemsEntries(dto.entries);
    const initialEntries = dto.entries.map((entry) => ({
      ...entry,
      referenceType: 'SaleQuotation',
      isInclusiveTax: false,
    }));
    const asyncEntries = await composeAsync(
      this.taxDTOTransformer.assocTaxRateFromTaxIdToEntries,
      this.taxDTOTransformer.assocTaxRateIdFromCodeToEntries,
    )(initialEntries);
    const entries = R.compose(
      R.map(R.omit(['taxCode'])),
      assocItemEntriesDefaultIndex,
    )(asyncEntries);

    const vatRatePercent =
      Number(
        (entries as Array<{ taxRate?: number }>).find((entry) => entry.taxRate)
          ?.taxRate,
      ) || 0;
    const vatAfterDiscount = computeSaleInvoiceVatAfterDiscount({
      entries,
      discount: 0,
      discountType: DiscountType.Percentage,
      vatRatePercent,
    });

    const org = await this.tenancyContext.getTenantMetadata();
    const initialDTO = {
      ...formatDateFields(
        omit(dto, ['entries', 'quotationNumber']),
        ['quotationDate'],
      ),
      quotationNumber,
      amount,
      discount: 0,
      discountType: DiscountType.Percentage,
      adjustment: 0,
      taxAmountWithheld: vatAfterDiscount.vatAmount,
      exchangeRate: dto.exchangeRate || 1,
      currencyCode: dto.currencyCode || org?.baseCurrency || 'LKR',
      entries,
    };

    return composeAsync(
      this.branchDTOTransform.transformDTO<SaleQuotation>,
      this.warehouseDTOTransform.transformDTO<SaleQuotation>,
    )(initialDTO);
  }
}
