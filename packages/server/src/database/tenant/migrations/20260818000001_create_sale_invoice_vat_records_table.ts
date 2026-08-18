/**
 * `sale_invoice_vat_records`: one row per Delivered sales invoice,
 * snapshotting the VAT it carried -- the output-VAT mirror of
 * `bill_vat_records` (input VAT), for the future VAT module (Sri Lanka 1B
 * output-VAT schedule) per docs/ops/PHASE1.md ("VAT").
 *
 * Every invoice is always calculated and posted internally as VAT-inclusive
 * (subtotal + VAT = total), regardless of whether the customer is
 * VAT-registered -- "Non-VAT invoice" is purely a *print format* choice
 * (unit price grossed up, VAT not broken out) applied at output time, not a
 * different internal calculation. `is_vat_customer` snapshots whether the
 * customer had a VAT/TIN number *at delivery time*, so the VAT module can
 * later tell which invoices were printed/should print as VAT vs Non-VAT,
 * independent of whatever the customer's TIN status is by the time someone
 * looks back at this record.
 *
 * `taxable_amount` / `vat_amount` are computed the same way as
 * `bill_vat_records` (`computeItemPriceLotUnitCosts`): one flat VAT % for
 * the whole invoice, applied to the amount net of both line and header
 * discounts -- not Bigcapital's own per-line `tax_amount`.
 */
exports.up = async function (knex) {
  await knex.schema.createTable('sale_invoice_vat_records', (table) => {
    table.increments();

    table
      .integer('sale_invoice_id')
      .unsigned()
      .notNullable()
      .unique()
      .references('id')
      .inTable('sales_invoices')
      .onDelete('CASCADE');

    table.string('invoice_no', 255).nullable();
    table.date('invoice_date').nullable();

    // No FK constraint: customers live in Bigcapital's shared `contacts`
    // table (polymorphic customer/vendor), same reasoning as
    // `bill_vat_records.vendor_id`.
    table.integer('customer_id').unsigned().notNullable();

    table.boolean('is_vat_customer').notNullable().defaultTo(false);

    table.decimal('vat_rate_percent', 5, 2).notNullable().defaultTo(0);
    table.decimal('taxable_amount', 13, 2).notNullable().defaultTo(0);
    table.decimal('vat_amount', 13, 2).notNullable().defaultTo(0);

    table.timestamps();

    table.index(['invoice_date']);
    table.index(['customer_id']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('sale_invoice_vat_records');
};
