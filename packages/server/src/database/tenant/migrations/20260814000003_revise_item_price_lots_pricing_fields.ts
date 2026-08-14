/**
 * Revises `item_price_lots` pricing fields to match the corrected VAT/
 * discount model from docs/ops/PHASE1.md ("VAT" / "Lots / GRN"):
 *
 * GRN VAT is a single flat rate for the whole bill, never per line, and a
 * lot needs its VAT-excluded list price and effective discount % available
 * *separately* (not just the collapsed VAT-inclusive net cost) so that:
 *
 *   - Non-VAT invoices can display the VAT-inclusive final price
 *     (`list_price_excl_vat * (1 - discount%) * (1 + vat%)`) as unit price.
 *   - VAT invoices can display the VAT-excluded final price
 *     (`list_price_excl_vat * (1 - discount%)`) as unit price, with VAT
 *     broken out separately on the bill total.
 *   - `unit_cost_net` (VAT-inclusive, used for COGS/accounts-payable) stays
 *     derivable from the same three numbers -- see the model's `unitCostNet`
 *     virtual getter -- so it never needs to be stored/kept in sync by hand.
 *
 * The prior `unit_cost_net` column (from the initial item-price-lots
 * migration) is dropped in favour of `list_price_excl_vat` +
 * `discount_percent`. Safe to drop without a backfill: no production data
 * exists in this table yet (confirmed with the business owner before
 * writing this migration).
 */
exports.up = async function (knex) {
  await knex.schema.alterTable('item_price_lots', (table) => {
    table.dropUnique(
      ['item_id', 'warehouse_id', 'unit_cost_net'],
      'item_price_lots_item_warehouse_cost_unique',
    );
  });

  await knex.schema.alterTable('item_price_lots', (table) => {
    table.dropColumn('unit_cost_net');
  });

  await knex.schema.alterTable('item_price_lots', (table) => {
    // VAT-excluded, pre-discount unit list price from the GRN line.
    table.decimal('list_price_excl_vat', 13, 2).notNullable().defaultTo(0);

    // Effective combined discount % (line discount + proportional share of
    // any bill-header discount) relative to list_price_excl_vat.
    table.decimal('discount_percent', 5, 2).notNullable().defaultTo(0);
  });

  await knex.schema.alterTable('item_price_lots', (table) => {
    // Explicit short name -- the default auto-generated name exceeds
    // MySQL's 64-char identifier limit (ER_TOO_LONG_IDENT).
    table.unique(
      [
        'item_id',
        'warehouse_id',
        'list_price_excl_vat',
        'discount_percent',
        'vat_rate_percent',
      ],
      { indexName: 'item_price_lots_pricing_unique' },
    );
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('item_price_lots', (table) => {
    table.dropUnique(
      [
        'item_id',
        'warehouse_id',
        'list_price_excl_vat',
        'discount_percent',
        'vat_rate_percent',
      ],
      'item_price_lots_pricing_unique',
    );
  });

  await knex.schema.alterTable('item_price_lots', (table) => {
    table.dropColumn('list_price_excl_vat');
    table.dropColumn('discount_percent');
  });

  await knex.schema.alterTable('item_price_lots', (table) => {
    table.decimal('unit_cost_net', 13, 2).notNullable().defaultTo(0);
  });

  await knex.schema.alterTable('item_price_lots', (table) => {
    table.unique(['item_id', 'warehouse_id', 'unit_cost_net'], {
      indexName: 'item_price_lots_item_warehouse_cost_unique',
    });
  });
};
