exports.up = function (knex) {
  return knex.schema.table('items', (table) => {
    table
      .integer('subcategory_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('items_subcategories')
      .onDelete('SET NULL');
  });
};

exports.down = function (knex) {
  return knex.schema.table('items', (table) => {
    table.dropColumn('subcategory_id');
  });
};
