/**
 * Astrans cash sales (receipts) need the same statutory-print and VAT
 * fields as invoices, plus taxAmountWithheld so GL can credit VAT payable
 * after the header % discount (same math as sale invoices).
 *
 * - `note` -- "Additional Information if any" on the Excel templates.
 * - `dms_payment_mode` -- CASH / BANK only (no CREDIT: payment is taken now).
 * - `tax_amount_withheld` -- VAT after header discount, posted on Close.
 *
 * See docs/ops/PHASE1.md ("Sales receipts").
 */
exports.up = async function (knex) {
  await knex.schema.alterTable('sales_receipts', (table) => {
    table.text('note').nullable();
    table.string('dms_payment_mode', 16).nullable();
    table.decimal('tax_amount_withheld', 13, 2).notNullable().defaultTo(0);
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('sales_receipts', (table) => {
    table.dropColumn('note');
    table.dropColumn('dms_payment_mode');
    table.dropColumn('tax_amount_withheld');
  });
};
