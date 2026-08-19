/**
 * Warehouse transfers must move a specific GRN price lot, not just item
 * quantity. `item_price_lot_id` is the source lot the user picked; on
 * Initiate that lot's real qty decreases, and on Transferred a matching
 * (list, discount %, VAT %) lot is merged/created at the destination
 * warehouse.
 *
 * See docs/ops/PHASE1.md ("Warehouse transfers").
 */
exports.up = async function (knex) {
  await knex.schema.alterTable('warehouses_transfers_entries', (table) => {
    table
      .integer('item_price_lot_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('item_price_lots')
      .onDelete('RESTRICT');
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('warehouses_transfers_entries', (table) => {
    table.dropColumn('item_price_lot_id');
  });
};
