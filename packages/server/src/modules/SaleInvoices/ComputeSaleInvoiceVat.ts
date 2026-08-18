import { DiscountType } from '@/common/types/Discount';
import { ItemEntry } from '@/modules/TransactionItemEntry/models/ItemEntry';

const round2 = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

/**
 * Astrans invoices always store VAT-excluded unit prices and line discount
 * percentages. Header discount is a percentage of that line-net subtotal.
 * VAT is then applied to the after-header-discount amount -- matching the
 * statutory Excel templates (X31 subtotal, X32 header discount, X33 taxable,
 * X34 VAT). See docs/ops/PHASE1.md ("VAT").
 */
export function lineNetExVat(entry: {
  quantity?: number | null;
  rate?: number | null;
  discount?: number | null;
  discountType?: DiscountType | string | null;
}): number {
  return ItemEntry.calcAmount({
    quantity: Number(entry.quantity) || 0,
    rate: Number(entry.rate) || 0,
    discount: Number(entry.discount) || 0,
  });
}

export function headerDiscountAmount(
  subtotal: number,
  discount?: number | null,
  discountType?: DiscountType | string | null,
): number {
  const value = Number(discount) || 0;
  if (!value) return 0;

  if (discountType === DiscountType.Amount || discountType === 'amount') {
    return value;
  }
  return subtotal * (value / 100);
}

export function computeSaleInvoiceVatAfterDiscount(params: {
  entries: Array<{
    quantity?: number | null;
    rate?: number | null;
    discount?: number | null;
    discountType?: DiscountType | string | null;
    taxRate?: number | null;
  }>;
  discount?: number | null;
  discountType?: DiscountType | string | null;
  vatRatePercent: number;
}): {
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  vatAmount: number;
  vatRatePercent: number;
} {
  const subtotal = round2(
    params.entries.reduce((sum, entry) => sum + lineNetExVat(entry), 0),
  );
  const discountAmount = round2(
    headerDiscountAmount(subtotal, params.discount, params.discountType),
  );
  const taxableAmount = round2(Math.max(subtotal - discountAmount, 0));
  const vatRatePercent = Number(params.vatRatePercent) || 0;
  const vatAmount = round2(taxableAmount * (vatRatePercent / 100));

  return {
    subtotal,
    discountAmount,
    taxableAmount,
    vatAmount,
    vatRatePercent,
  };
}

export function formatVatRateLabel(rate: number): string {
  if (!Number.isFinite(rate)) return '0';
  return Number(rate.toFixed(4)).toString();
}

export const MAX_SALE_INVOICE_LINES = 9;
