exports.up = async function (knex) {
  await knex.schema.alterTable('contacts', (table) => {
    table
      .integer('area_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('customer_areas')
      .onDelete('SET NULL');

    table
      .integer('route_city_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('customer_route_cities')
      .onDelete('SET NULL');

    // 3rd address line to match the Astrans invoice address format.
    table.string('billing_address3').nullable();
    table.string('shipping_address3').nullable();

    table.string('contact_person').nullable();

    // Sri Lanka VAT/TIN number - 9 digits.
    table.string('tin_number', 9).nullable();

    // Customer risk category: A (low risk) / B (monitored) / C (high risk) /
    // D (restricted). Every new customer starts at "B" per the credit policy.
    // The automatic recompute logic (based on payment history) is a
    // separate, later piece of work - this column just stores the current
    // value for now.
    table.string('risk_category', 1).notNullable().defaultTo('B');
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('contacts', (table) => {
    table.dropForeign(['area_id']);
    table.dropForeign(['route_city_id']);
  });
  await knex.schema.alterTable('contacts', (table) => {
    table.dropColumn('area_id');
    table.dropColumn('route_city_id');
    table.dropColumn('billing_address3');
    table.dropColumn('shipping_address3');
    table.dropColumn('contact_person');
    table.dropColumn('tin_number');
    table.dropColumn('risk_category');
  });
};
