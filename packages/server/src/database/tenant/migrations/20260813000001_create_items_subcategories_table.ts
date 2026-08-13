exports.up = function (knex) {
  return knex.schema.createTable('items_subcategories', (table) => {
    table.increments();
    table.string('name').index();
    table.text('description');

    table
      .integer('category_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('items_categories')
      .onDelete('CASCADE');

    table.integer('user_id').unsigned().index();
    table.timestamps();

    table.unique(['category_id', 'name']);
  });
};

exports.down = (knex) => knex.schema.dropTableIfExists('items_subcategories');
