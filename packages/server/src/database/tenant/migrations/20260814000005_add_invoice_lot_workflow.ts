/**
 * Foundations for the Astrans DMS invoice status pipeline (Pending ->
 * Reserved -> Invoiced -> Delivered) and the invoice-side item price-lot
 * picker -- see docs/ops/PHASE1.md ("Status pipeline", "Lots / GRN").
 *
 * `sales_invoices.dms_status` is Astrans' own status, layered *on top of*
 * Bigcapital's native `delivered_at` (which already gates GL/inventory
 * posting via `InvoiceGLEntriesSubscriber` / `InvoiceWriteInventoryTransactions`
 * -- see those files' `if (!saleInvoice.deliveredAt) return null;` guards).
 * Pending/Reserved/Invoiced all correspond to Bigcapital's native "draft"
 * (not yet delivered) state; only Delivered sets `delivered_at`. This means
 * we don't need to touch Bigcapital's own GL/inventory posting code at all
 * -- we just control *when* the existing native "deliver" action fires.
 *
 * `items_entries.item_price_lot_id` records which GRN price/discount batch
 * (see `item_price_lots`) a sold line was picked from -- needed both to
 * validate/consume that lot's stock and to compute the Secondary P&L
 * variance later. Nullable + SET NULL on delete since it's informational,
 * not something that should block deleting a lot.
 *
 * `item_price_lot_reservations` mirrors `item_price_lot_receipts` (the GRN
 * side) but for the sell side: one row per (invoice line, lot) pairing
 * while stock is held aside for that invoice. `consumed_at` is set once the
 * invoice reaches Delivered and the hold becomes a real stock decrease;
 * reservations are removed entirely if the invoice drops back out of
 * Reserved/Invoiced (releasing the hold).
 */
exports.up = async function (knex) {
  await knex.schema.alterTable('sales_invoices', (table) => {
    table.string('dms_status', 20).notNullable().defaultTo('pending');
    table.index(['dms_status']);
  });

  // Backfill: invoices already delivered under the native mechanism are
  // Delivered under ours too; everything else starts life as Pending
  // (safe default -- Astrans has no real invoice data yet to preserve).
  await knex('sales_invoices')
    .whereNotNull('delivered_at')
    .update({ dms_status: 'delivered' });

  await knex.schema.alterTable('items_entries', (table) => {
    table
      .integer('item_price_lot_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('item_price_lots')
      .onDelete('SET NULL');
  });

  await knex.schema.createTable('item_price_lot_reservations', (table) => {
    table.increments();

    table
      .integer('lot_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('item_price_lots')
      .onDelete('CASCADE');

    table
      .integer('source_invoice_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('sales_invoices')
      .onDelete('CASCADE');

    table
      .integer('source_invoice_entry_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('items_entries')
      .onDelete('SET NULL');

    table.decimal('qty', 13, 3).notNullable();
    table.dateTime('consumed_at').nullable();
    table.timestamps();

    table.index(['source_invoice_id']);
    // Explicit short name -- default auto-generated name risks exceeding
    // MySQL's 64-char identifier limit (ER_TOO_LONG_IDENT), as previously
    // hit on item_price_lot_receipts.
    table.unique(['source_invoice_id', 'source_invoice_entry_id'], {
      indexName: 'item_price_lot_reservations_invoice_entry_unique',
    });
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('item_price_lot_reservations');

  await knex.schema.alterTable('items_entries', (table) => {
    table.dropColumn('item_price_lot_id');
  });

  await knex.schema.alterTable('sales_invoices', (table) => {
    table.dropColumn('dms_status');
  });
};
