/**
 * Astrans credit notes use the same statutory-print and VAT-after-discount
 * math as sale invoices. Payment is not taken on a credit note (it reduces
 * AR), so there is no dms_payment_mode.
 *
 * - `credit_note_message` -- Narration on the Excel templates.
 * - `tax_amount_withheld` -- VAT after header discount, posted on Open
 *   as Dr VAT payable (reverse of the invoice Cr VAT payable).
 *
 * See docs/ops/PHASE1.md ("Credit notes").
 */
exports.up = async function (knex) {
  await knex.schema.alterTable('credit_notes', (table) => {
    table.text('credit_note_message').nullable();
    table.decimal('tax_amount_withheld', 13, 2).notNullable().defaultTo(0);
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('credit_notes', (table) => {
    table.dropColumn('credit_note_message');
    table.dropColumn('tax_amount_withheld');
  });
};
