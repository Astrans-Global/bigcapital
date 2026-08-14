import { DiscountType } from '@/common/types/Discount';

export interface ILotCostBillEntryInput {
  /** Quantity purchased on this GRN line. */
  quantity: number;
  /** VAT-excluded unit list price entered on the bill line. */
  rate: number;
  discount?: number | null;
  discountType?: DiscountType | null;
}

export interface ILotCostBillInput {
  discount?: number | null;
  discountType?: DiscountType | null;
  entries: ILotCostBillEntryInput[];
}

export interface ILotCostResult {
  /** VAT-excluded net amount for this line, after the line's own discount. */
  lineNetExVat: number;
  /** This line's share of the bill-header discount (VAT-excl basis). */
  headerDiscountAllocated: number;
  /**
   * VAT-excluded, pre-discount unit list price -- stored as-is on the lot
   * for future invoice display (see docs/ops/PHASE1.md "Lots / GRN").
   */
  listPriceExclVat: number;
  /**
   * Effective combined discount % (this line's own discount plus its
   * proportional share of any bill-header discount), relative to
   * `listPriceExclVat`. Rounded to 2dp for storage -- `unitCostNet` below
   * is re-derived from this rounded figure, consistent with the project's
   * round-2dp-and-absorb rounding convention.
   */
  discountPercent: number;
  /** VAT rate (0-100) applied to the whole bill -- see `vatRatePercent`. */
  vatRatePercent: number;
  /** Final per-unit lot cost: VAT-inclusive net cost, rounded to 2dp. */
  unitCostNet: number;
}

const round2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

/**
 * Computes each line's VAT-excluded net amount (list price, less the
 * line's own discount) -- the same "amount - discountAmount" formula
 * ItemEntry uses internally (see ItemEntry.discountAmount).
 */
function lineNetExVat(entry: ILotCostBillEntryInput): number {
  const amount = entry.quantity * entry.rate;
  const discount = entry.discount ?? 0;

  const discountAmount =
    entry.discountType === DiscountType.Amount ? discount : amount * (discount / 100);

  return amount - discountAmount;
}

/**
 * Computes the item price-lot fields for every entry of a GRN bill, per
 * docs/ops/PHASE1.md ("Lots / GRN"):
 *
 *   lot_net_per_unit = (list_excl_vat * (1 - line_discount%) - proportional
 *                       share of bill-header discount) / quantity
 *   discount_percent = (1 - lot_net_per_unit / list_excl_vat) * 100
 *   unit_cost_net = round(lot_net_per_unit * (1 + vat%), 2)
 *
 * The bill-header discount is allocated proportionally across lines by
 * each line's share of the total VAT-excluded, line-discounted amount --
 * computed independently of Bigcapital's own Bill.amount/discountAmount
 * virtuals so this is correct regardless of how those interact with
 * inclusive-tax/withholding-tax settings on the bill header.
 *
 * There is deliberately no per-line tax rate here: VAT on a GRN is a
 * single flat rate for the whole bill (never entered per line -- see the
 * `enableTaxRates={false}` change on the Bill form), so `vatRatePercent`
 * is the same org-configured `defaultVatRatePercent` for every entry.
 *
 * @param bill - Header discount + line entries.
 * @param defaultVatRatePercent - The org's single flat VAT % for this bill.
 * @returns One result per entry, in the same order as `bill.entries`.
 */
export function computeItemPriceLotUnitCosts(
  bill: ILotCostBillInput,
  defaultVatRatePercent: number,
): ILotCostResult[] {
  const lineNets = bill.entries.map(lineNetExVat);
  const totalLineNetExVat = lineNets.reduce((sum, value) => sum + value, 0);

  const headerDiscount = bill.discount ?? 0;
  const headerDiscountAmount =
    bill.discountType === DiscountType.Amount
      ? headerDiscount
      : totalLineNetExVat * (headerDiscount / 100);

  return bill.entries.map((entry, index) => {
    const netExVat = lineNets[index];
    const share = totalLineNetExVat > 0 ? netExVat / totalLineNetExVat : 0;
    const headerDiscountAllocated = headerDiscountAmount * share;

    const lotNetPreVatTotal = netExVat - headerDiscountAllocated;
    const lotNetPreVatPerUnit =
      entry.quantity > 0 ? lotNetPreVatTotal / entry.quantity : 0;

    const listPriceExclVat = round2(entry.rate);
    const discountPercent =
      listPriceExclVat > 0
        ? round2((1 - lotNetPreVatPerUnit / listPriceExclVat) * 100)
        : 0;

    const vatRatePercent = defaultVatRatePercent;
    // Re-derive from the rounded (listPriceExclVat, discountPercent) pair
    // rather than lotNetPreVatPerUnit directly, so unitCostNet always
    // matches what the model's virtual attribute would compute from the
    // persisted row (see ItemPriceLot.model.ts).
    const netExVatFromStored = listPriceExclVat * (1 - discountPercent / 100);
    const unitCostNet = round2(netExVatFromStored * (1 + vatRatePercent / 100));

    return {
      lineNetExVat: netExVat,
      headerDiscountAllocated,
      listPriceExclVat,
      discountPercent,
      vatRatePercent,
      unitCostNet,
    };
  });
}
