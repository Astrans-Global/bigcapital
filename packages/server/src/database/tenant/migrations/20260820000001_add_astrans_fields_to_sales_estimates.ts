/**
 * Astrans estimates use the same VAT-after-discount math as sale invoices
 * so TAX ESTIMATE / SALE ESTIMATE downloads match the statutory sheets.
 * Estimates still post nothing to GL or stock.
 *
 * See docs/ops/PHASE1.md ("Estimates").
 */
exports.up = async function (knex) {
  await knex.schema.alterTable('sales_estimates', (table) => {
    table.decimal('tax_amount_withheld', 13, 2).notNullable().defaultTo(0);
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('sales_estimates', (table) => {
    table.dropColumn('tax_amount_withheld');
  });
};
