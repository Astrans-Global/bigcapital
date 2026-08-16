exports.up = function (knex) {
  return knex.schema.createTable('customer_route_cities', (table) => {
    table.increments();
    table.string('name').notNullable();
    table.index('name');

    table
      .integer('area_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('customer_areas')
      .onDelete('CASCADE');

    table.integer('user_id').unsigned().index();
    table.timestamps();

    table.unique(['area_id', 'name']);
  });
};

exports.down = (knex) => knex.schema.dropTableIfExists('customer_route_cities');
