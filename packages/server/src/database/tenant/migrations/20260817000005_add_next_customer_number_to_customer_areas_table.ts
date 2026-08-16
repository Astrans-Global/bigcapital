// Backs the auto-generated customer code (e.g. "QQ-0001"): each area keeps
// its own running sequence, independent from the invoice numbering sequence.
exports.up = async function (knex) {
  await knex.schema.alterTable('customer_areas', (table) => {
    table.integer('next_customer_number').unsigned().notNullable().defaultTo(1);
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('customer_areas', (table) => {
    table.dropColumn('next_customer_number');
  });
};
