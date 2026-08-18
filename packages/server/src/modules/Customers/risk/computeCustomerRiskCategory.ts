/**
 * Astrans customer risk A/B/C/D — snapshot of *current* unpaid Delivered
 * invoices. Grade is not sticky: if the conditions no longer hold, the
 * customer leaves that grade. See docs/ops/PHASE1.md ("Customers").
 *
 * Days delayed = calendar days from invoice date to today (not due date).
 * "Cleared" in Phase 1 = Receive Payment applied (due amount 0). Post-dated
 * cheques are Phase 2 and are not counted as cleared here.
 */

export type CustomerRiskCategory = 'A' | 'B' | 'C' | 'D';

export const RISK_B_DELAY_DAYS = 45;
export const RISK_CD_DELAY_DAYS = 90;
export const RISK_C_DUE_THRESHOLD = 300_000;
export const RISK_D_DUE_THRESHOLD = 1_000_000;
/** "More than 2 invoices" delayed past 45 days. */
export const RISK_B_MIN_DELAYED_INVOICES = 3;

export interface CustomerRiskInvoiceInput {
  daysDue: number;
  dueAmount: number;
}

/**
 * Evaluate D → C → B → A against the customer's currently-open delivered
 * invoices. Residual (1–2 invoices delayed past 45 days, not C/D) is B,
 * because that customer is not "fully cleared within 45 days" (A).
 */
export function computeCustomerRiskCategory(
  invoices: CustomerRiskInvoiceInput[],
): CustomerRiskCategory {
  const open = invoices.filter((invoice) => invoice.dueAmount > 0);
  const totalDue = open.reduce((sum, invoice) => sum + invoice.dueAmount, 0);
  const delayedOver90 = open.filter(
    (invoice) => invoice.daysDue > RISK_CD_DELAY_DAYS,
  ).length;
  const delayedOver45 = open.filter(
    (invoice) => invoice.daysDue > RISK_B_DELAY_DAYS,
  ).length;

  if (delayedOver90 >= 1 && totalDue > RISK_D_DUE_THRESHOLD) {
    return 'D';
  }
  if (delayedOver90 >= 1 && totalDue > RISK_C_DUE_THRESHOLD) {
    return 'C';
  }
  if (delayedOver45 >= RISK_B_MIN_DELAYED_INVOICES) {
    return 'B';
  }
  if (delayedOver45 >= 1) {
    return 'B';
  }
  return 'A';
}
