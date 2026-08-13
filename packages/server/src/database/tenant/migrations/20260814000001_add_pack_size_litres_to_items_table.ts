exports.up = function (knex) {
  return knex.schema.table('items', (table) => {
    table.decimal('pack_size_litres', 10, 3).nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.table('items', (table) => {
    table.dropColumn('pack_size_litres');
  });
};
