import * as R from 'ramda';
import { Inject, Injectable } from '@nestjs/common';
import { omit, sumBy } from 'lodash';
import * as composeAsync from 'async/compose';
import { SaleEstimateValidators } from './SaleEstimateValidators.service';
import { formatDateFields } from '@/utils/format-date-fields';
import * as moment from 'moment';
import { SaleEstimateIncrement } from './SaleEstimateIncrement.service';
import { BranchTransactionDTOTransformer } from '@/modules/Branches/integrations/BranchTransactionDTOTransform';
import { WarehouseTransactionDTOTransform } from '@/modules/Warehouses/Integrations/WarehouseTransactionDTOTransform';
import { assocItemEntriesDefaultIndex } from '@/utils/associate-item-entries-index';
import { BrandingTemplateDTOTransformer } from '@/modules/PdfTemplate/BrandingTemplateDTOTransformer';
import { ItemEntry } from '@/modules/TransactionItemEntry/models/ItemEntry';
import { SaleEstimate } from '../models/SaleEstimate';
import { Customer } from '@/modules/Customers/models/Customer';
import { ISaleEstimateDTO } from '../types/SaleEstimates.types';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { CommandSaleEstimateDto } from '../dtos/SaleEstimate.dto';
import { ItemEntriesTaxTransactions } from '@/modules/TaxRates/ItemEntriesTaxTransactions.service';
import { computeSaleInvoiceVatAfterDiscount } from '@/modules/SaleInvoices/ComputeSaleInvoiceVat';
import { DiscountType } from '@/common/types/Discount';

@Injectable()
export class SaleEstimateDTOTransformer {
  constructor(
    @Inject(ItemEntry.name)
    private itemEntryModel: TenantModelProxy<typeof ItemEntry>,

    private readonly validators: SaleEstimateValidators,
    private readonly branchDTOTransform: BranchTransactionDTOTransformer,
    private readonly warehouseDTOTransform: WarehouseTransactionDTOTransform,
    private readonly estimateIncrement: SaleEstimateIncrement,
    private readonly brandingTemplatesTransformer: BrandingTemplateDTOTransformer,
    private readonly taxDTOTransformer: ItemEntriesTaxTransactions,
  ) {}

  /**
   * Transform create DTO object ot model object.
   * @param  {ISaleEstimateDTO} saleEstimateDTO - Sale estimate DTO.
   * @param {Customer} paymentCustomer - Payment customer.
   * @param {SaleEstimate} oldSaleEstimate - Old sale estimate.
   * @return {ISaleEstimate}
   */
  async transformDTOToModel(
    estimateDTO: CommandSaleEstimateDto,
    paymentCustomer: Customer,
    oldSaleEstimate?: SaleEstimate,
  ): Promise<SaleEstimate> {
    const amount = sumBy(estimateDTO.entries, (e) =>
      this.itemEntryModel().calcAmount(e),
    );
    // Retrieve the next invoice number.
    const autoNextNumber = await this.estimateIncrement.getNextEstimateNumber();

    // Retrieve the next estimate number.
    const estimateNumber =
      estimateDTO.estimateNumber ||
      oldSaleEstimate?.estimateNumber ||
      autoNextNumber;

    // Validate the sale estimate number require.
    this.validators.validateEstimateNoRequire(estimateNumber);

    const initialEntries = estimateDTO.entries.map((entry) => ({
      ...entry,
      referenceType: 'SaleEstimate',
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
      discount: estimateDTO.discount,
      discountType: estimateDTO.discountType || DiscountType.Percentage,
      vatRatePercent,
    });

    const expirationDate =
      estimateDTO.estimateDate || oldSaleEstimate?.estimateDate;

    const initialDTO = {
      amount,
      ...formatDateFields(
        omit(estimateDTO, ['delivered', 'entries', 'attachments']),
        ['estimateDate', 'expirationDate'],
      ),
      expirationDate,
      currencyCode: paymentCustomer.currencyCode,
      exchangeRate: estimateDTO.exchangeRate || 1,
      taxAmountWithheld: vatAfterDiscount.vatAmount,
      discountType: estimateDTO.discountType || DiscountType.Percentage,
      ...(estimateNumber ? { estimateNumber } : {}),
      entries,
      // Avoid rewrite the deliver date in edit mode when already published.
      ...(estimateDTO.delivered &&
        !oldSaleEstimate?.deliveredAt && {
          deliveredAt: moment().toMySqlDateTime(),
        }),
    };
    const asyncDto = await composeAsync(
      this.branchDTOTransform.transformDTO<SaleEstimate>,
      this.warehouseDTOTransform.transformDTO<SaleEstimate>,

      // Assigns the default branding template id to the invoice DTO.
      this.brandingTemplatesTransformer.assocDefaultBrandingTemplate(
        'SaleEstimate',
      ),
    )(initialDTO);

    return asyncDto;
  }

  /**
   * Retrieve estimate number to object model.
   * @param {ISaleEstimateDTO} saleEstimateDTO
   * @param {ISaleEstimate} oldSaleEstimate
   */
  public async transformEstimateNumberToModel(
    saleEstimateDTO: ISaleEstimateDTO,
    oldSaleEstimate?: SaleEstimate,
  ): Promise<string> {
    const autoNextNumber = await this.estimateIncrement.getNextEstimateNumber();

    if (saleEstimateDTO.estimateNumber) {
      return saleEstimateDTO.estimateNumber;
    }
    return oldSaleEstimate ? oldSaleEstimate.estimateNumber : autoNextNumber;
  }
}
