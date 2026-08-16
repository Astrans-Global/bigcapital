exports.up = function (knex) {
  return knex.schema.createTable('customer_areas', (table) => {
    table.increments();
    table.string('name').notNullable();
    table.index('name');

    // The "QQ" code from the Astrans invoice numbering format
    // (YYMMM_ASTRANSQQ_XXXXX). Stored now so it's ready when the real
    // per-area numbering is wired up later.
    table.string('invoice_number_code', 2).nullable();
    table.integer('next_invoice_number').unsigned().notNullable().defaultTo(10001);

    table.integer('user_id').unsigned().index();
    table.timestamps();

    table.unique(['name']);
    table.unique(['invoice_number_code']);
  });
};

exports.down = (knex) => knex.schema.dropTableIfExists('customer_areas');
