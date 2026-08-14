/**
 * `bill_vat_records`: one row per opened Bill (GRN), snapshotting the VAT
 * this purchase carried -- purpose-built for the future VAT module (Sri
 * Lanka 1B input-VAT schedule) per docs/ops/PHASE1.md ("VAT"), rather than
 * requiring that module to reconstruct VAT figures from Bigcapital's
 * generic `tax_rate_transactions` + `items_entries` tables.
 *
 * `taxable_amount` and `vat_amount` are computed the same way as the
 * item-price-lot cost calculation (`ComputeItemPriceLotCost.ts`): VAT is a
 * single flat rate for the whole bill, applied to the VAT-excluded amount
 * *after* both line and header discounts -- not Bigcapital's own per-line
 * `tax_amount` (which is computed pre-discount and drives GL/AP posting,
 * a separate concern from what was actually charged/needs to be filed).
 *
 * `bill_number` is snapshotted (not just joined via `bill_id`) so this
 * table keeps meaning independently of bill numbering/deletion cleanup.
 */
exports.up = async function (knex) {
  await knex.schema.createTable('bill_vat_records', (table) => {
    table.increments();

    table
      .integer('bill_id')
      .unsigned()
      .notNullable()
      .unique()
      .references('id')
      .inTable('bills')
      .onDelete('CASCADE');

    table.string('bill_number', 255).nullable();
    table.date('bill_date').notNullable();

    // No FK constraint: vendors live in Bigcapital's shared `contacts`
    // table (polymorphic customer/vendor), not a dedicated `vendors` table.
    table.integer('vendor_id').unsigned().notNullable();

    table.decimal('vat_rate_percent', 5, 2).notNullable().defaultTo(0);
    table.decimal('taxable_amount', 13, 2).notNullable().defaultTo(0);
    table.decimal('vat_amount', 13, 2).notNullable().defaultTo(0);

    table.timestamps();

    table.index(['bill_date']);
    table.index(['vendor_id']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('bill_vat_records');
};
