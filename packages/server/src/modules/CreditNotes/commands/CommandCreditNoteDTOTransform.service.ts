import { Injectable } from '@nestjs/common';
import { omit } from 'lodash';
import * as moment from 'moment';
import * as composeAsync from 'async/compose';
import * as R from 'ramda';
import { ERRORS } from '../constants';
import { ServiceError } from '@/modules/Items/ServiceError';
import { ItemsEntriesService } from '@/modules/Items/ItemsEntries.service';
import { BranchTransactionDTOTransformer } from '@/modules/Branches/integrations/BranchTransactionDTOTransform';
import { WarehouseTransactionDTOTransform } from '@/modules/Warehouses/Integrations/WarehouseTransactionDTOTransform';
import { BrandingTemplateDTOTransformer } from '../../PdfTemplate/BrandingTemplateDTOTransformer';
import { assocItemEntriesDefaultIndex } from '@/utils/associate-item-entries-index';
import { formatDateFields } from '@/utils/format-date-fields';
import { CreditNoteAutoIncrementService } from './CreditNoteAutoIncrement.service';
import { CreditNote } from '../models/CreditNote';
import {
  CreateCreditNoteDto,
  EditCreditNoteDto,
} from '../dtos/CreditNote.dto';
import { ItemEntriesTaxTransactions } from '@/modules/TaxRates/ItemEntriesTaxTransactions.service';
import { computeSaleInvoiceVatAfterDiscount } from '@/modules/SaleInvoices/ComputeSaleInvoiceVat';
import { DiscountType } from '@/common/types/Discount';

@Injectable()
export class CommandCreditNoteDTOTransform {
  /**
   * @param {ItemsEntriesService} itemsEntriesService - The items entries service.
   * @param {BranchTransactionDTOTransformer} branchDTOTransform - The branch transaction DTO transformer.
   * @param {WarehouseTransactionDTOTransform} warehouseDTOTransform - The warehouse transaction DTO transformer.
   * @param {BrandingTemplateDTOTransformer} brandingTemplatesTransformer - The branding template DTO transformer.
   * @param {CreditNoteAutoIncrementService} creditNoteAutoIncrement - The credit note auto increment service.
   */
  constructor(
    private readonly itemsEntriesService: ItemsEntriesService,
    private readonly branchDTOTransform: BranchTransactionDTOTransformer,
    private readonly warehouseDTOTransform: WarehouseTransactionDTOTransform,
    private readonly brandingTemplatesTransformer: BrandingTemplateDTOTransformer,
    private readonly creditNoteAutoIncrement: CreditNoteAutoIncrementService,
    private readonly taxDTOTransformer: ItemEntriesTaxTransactions,
  ) {}

  /**
   * Transforms the credit/edit DTO to model.
   * @param {ICreditNoteNewDTO | ICreditNoteEditDTO} creditNoteDTO
   * @param {string} customerCurrencyCode -
   */
  public transformCreateEditDTOToModel = async (
    creditNoteDTO: CreateCreditNoteDto | EditCreditNoteDto,
    customerCurrencyCode: string,
    oldCreditNote?: CreditNote,
  ): Promise<CreditNote> => {
    // Retrieve the total amount of the given items entries.
    const amount = this.itemsEntriesService.getTotalItemsEntries(
      creditNoteDTO.entries,
    );
    const initialEntries = creditNoteDTO.entries.map((entry) => ({
      ...entry,
      referenceType: 'CreditNote',
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
      discount: creditNoteDTO.discount,
      discountType: creditNoteDTO.discountType || DiscountType.Percentage,
      vatRatePercent,
    });

    // Retrieves the next credit note number.
    const autoNextNumber = this.creditNoteAutoIncrement.getNextCreditNumber();

    // Determines the credit note number.
    const creditNoteNumber =
      creditNoteDTO.creditNoteNumber ||
      oldCreditNote?.creditNoteNumber ||
      autoNextNumber;

    const initialDTO = {
      ...formatDateFields(omit(creditNoteDTO, ['open', 'attachments', 'entries']), [
        'creditNoteDate',
      ]),
      creditNoteNumber,
      amount,
      taxAmountWithheld: vatAfterDiscount.vatAmount,
      currencyCode: customerCurrencyCode,
      exchangeRate: creditNoteDTO.exchangeRate || 1,
      entries,
      ...(creditNoteDTO.open &&
        !oldCreditNote?.openedAt && {
          openedAt: moment().toMySqlDateTime(),
        }),
      refundedAmount: 0,
      invoicesAmount: 0,
    };
    const asyncDto = (await composeAsync(
      this.branchDTOTransform.transformDTO<CreditNote>,
      this.warehouseDTOTransform.transformDTO<CreditNote>,

      // Assigns the default branding template id to the invoice DTO.
      this.brandingTemplatesTransformer.assocDefaultBrandingTemplate(
        'CreditNote',
      ),
    )(initialDTO)) as CreditNote;

    return asyncDto;
  };

  /**
   * Validate the credit note remaining amount.
   * @param {ICreditNote} creditNote
   * @param {number} amount
   */
  public validateCreditRemainingAmount = (
    creditNote: CreditNote,
    amount: number,
  ) => {
    if (creditNote.creditsRemaining < amount) {
      throw new ServiceError(ERRORS.CREDIT_NOTE_HAS_NO_REMAINING_AMOUNT);
    }
  };
}
