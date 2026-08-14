/**
 * Item price-lots: Astrans ops GRN cost lots.
 *
 * `item_price_lots` is one row per distinct (item, warehouse, unit cost)
 * purchase batch. `unit_cost_net` is the VAT-inclusive net cost per unit
 * per docs/ops/PHASE1.md ("Lots / GRN"): VAT-excl list price, less line
 * discount, less a proportional share of any bill-header discount, then
 * grossed up by the VAT rate. A new GRN line only creates a new lot row
 * when its computed unit cost differs from an existing open lot for the
 * same item + warehouse; otherwise its quantity merges into that lot.
 *
 * `item_price_lot_receipts` is the audit trail of which bill (GRN) lines
 * fed how much quantity into each lot -- needed because a lot can be fed
 * by more than one bill once merging is in play, so reverting/editing a
 * specific bill must be able to undo exactly its own contribution.
 *
 * This is intentionally separate from Bigcapital's own
 * `inventory_cost_lot_tracker` (an internal weighted-average costing
 * ledger, not a user-selectable purchase-price lot). Bigcapital's native
 * inventory quantity/valuation keeps working unmodified; these tables are
 * additive, for Astrans' price-lot picker + Secondary P&L.
 */
exports.up = async function (knex) {
  await knex.schema.createTable('item_price_lots', (table) => {
    table.increments();

    table
      .integer('item_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('items');

    table
      .integer('warehouse_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('warehouses');

    // VAT-inclusive net cost per unit -- the "lot cost" used for COGS.
    table.decimal('unit_cost_net', 13, 2).notNullable();

    // Snapshot of the VAT % used to gross up this lot, for 1B filing later.
    table.decimal('vat_rate_percent', 5, 2).notNullable().defaultTo(0);

    // Lifetime total ever received into this lot (audit/display only).
    table.decimal('original_qty', 13, 3).notNullable().defaultTo(0);
    table.decimal('real_qty', 13, 3).notNullable().defaultTo(0);
    table.decimal('reserved_qty', 13, 3).notNullable().defaultTo(0);

    table.integer('user_id').unsigned().index();
    table.timestamps();

    table.index(['item_id', 'warehouse_id']);
    table.unique(['item_id', 'warehouse_id', 'unit_cost_net']);
  });

  await knex.schema.createTable('item_price_lot_receipts', (table) => {
    table.increments();

    table
      .integer('lot_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('item_price_lots')
      .onDelete('CASCADE');

    table
      .integer('source_bill_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('bills')
      .onDelete('CASCADE');

    table
      .integer('source_bill_entry_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('items_entries')
      .onDelete('SET NULL');

    table.decimal('qty', 13, 3).notNullable();
    table.timestamps();

    table.index(['source_bill_id']);
    table.unique(['source_bill_id', 'source_bill_entry_id']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('item_price_lot_receipts');
  await knex.schema.dropTableIfExists('item_price_lots');
};
