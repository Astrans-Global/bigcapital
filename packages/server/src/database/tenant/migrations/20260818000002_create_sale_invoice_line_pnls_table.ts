/**
 * `sale_invoice_line_pnls`: one row per Delivered invoice line that was
 * sold from a picked item price-lot, snapshotting the Secondary P&L inputs
 * for that line -- see docs/ops/PHASE1.md ("Secondary P&L"):
 *
 *   lot_net_per_unit  = lot.list_price_excl_vat x (1 - lot.discount_percent%)
 *   sell_net_per_unit = sell list price x (1 - effective discount%),
 *                       ex-VAT, net of both the line's own discount and its
 *                       share of any header-level invoice discount
 *   line_pnl          = quantity x (sell_net_per_unit - lot_net_per_unit)
 *
 * Snapshotted (rather than recomputed live from `items_entries` +
 * `item_price_lots` at report time) so the report keeps showing the true
 * cost/price that applied *at the moment of delivery*, even if the lot's
 * own record or the invoice line is edited afterwards for an unrelated
 * reason. Only written for Delivered invoices (Pending/Reserved/Invoiced
 * aren't real sales yet) and only for lines with a lot actually picked --
 * a line with no lot has no cost basis to compare against.
 */
exports.up = async function (knex) {
  await knex.schema.createTable('sale_invoice_line_pnls', (table) => {
    table.increments();

    table
      .integer('sale_invoice_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('sales_invoices')
      .onDelete('CASCADE');

    table
      .integer('sale_invoice_entry_id')
      .unsigned()
      .notNullable()
      .unique()
      .references('id')
      .inTable('items_entries')
      .onDelete('CASCADE');

    table
      .integer('item_price_lot_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('item_price_lots')
      .onDelete('CASCADE');

    table.decimal('quantity', 13, 3).notNullable();
    table.decimal('lot_net_per_unit', 13, 4).notNullable();
    table.decimal('sell_net_per_unit', 13, 4).notNullable();
    table.decimal('line_pnl', 13, 2).notNullable();

    table.timestamps();

    table.index(['sale_invoice_id']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('sale_invoice_line_pnls');
};
