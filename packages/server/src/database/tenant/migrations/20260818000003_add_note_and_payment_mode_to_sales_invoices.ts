/**
 * Statutory invoice print (VAT / Non-VAT Excel+PDF) needs two invoice-header
 * fields that Bigcapital did not have:
 *
 * - `note` -- "Additional Information if any" on the Excel templates.
 *   Distinct from `invoice_message`, which is now labelled Narration and
 *   printed in the Narration slot.
 * - `dms_payment_mode` -- CASH / BANK / CREDIT, replacing the unused Stripe
 *   "Payment Options" picker on the invoice form.
 *
 * See docs/ops/PHASE1.md ("VAT / Non-VAT invoice download").
 */
exports.up = async function (knex) {
  await knex.schema.alterTable('sales_invoices', (table) => {
    table.text('note').nullable();
    table.string('dms_payment_mode', 16).nullable();
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('sales_invoices', (table) => {
    table.dropColumn('note');
    table.dropColumn('dms_payment_mode');
  });
};
