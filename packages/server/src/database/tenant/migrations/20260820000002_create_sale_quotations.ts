/**
 * Astrans quotations are a price-list document for prospects. They are
 * not a customer, not an estimate, and never become an invoice. No GL,
 * no stock. Numbering is QTN-0001 and only increments (deleted numbers
 * are not reused).
 *
 * See docs/ops/PHASE1.md ("Quotations").
 */
exports.up = async function (knex) {
  const exists = await knex.schema.hasTable('sales_quotations');
  if (!exists) {
    await knex.schema.createTable('sales_quotations', (table) => {
      table.increments();
      table.string('quotation_number').index();
      table.date('quotation_date').index();
      table.string('company_name');
      table.string('address_to');
      table.string('address_line_1');
      table.string('address_line_2');
      table.string('currency_code', 3);
      table.decimal('exchange_rate', 13, 9).notNullable().defaultTo(1);
      table.decimal('amount', 13, 3).notNullable().defaultTo(0);
      table.decimal('discount', 13, 3).notNullable().defaultTo(0);
      table.string('discount_type').notNullable().defaultTo('percentage');
      table.decimal('adjustment', 13, 3).notNullable().defaultTo(0);
      table.decimal('tax_amount_withheld', 13, 2).notNullable().defaultTo(0);
      table.integer('warehouse_id').unsigned().index();
      table.integer('branch_id').unsigned().index();
      table.integer('user_id').unsigned().index();
      table.timestamps();
    });
  }

  const existing = await knex('settings')
    .where({ group: 'sales_quotations', key: 'next_number' })
    .first();
  if (!existing) {
    await knex('settings').insert([
      {
        group: 'sales_quotations',
        key: 'auto_increment',
        value: '1',
      },
      {
        group: 'sales_quotations',
        key: 'next_number',
        value: '1',
      },
      {
        group: 'sales_quotations',
        key: 'number_prefix',
        value: 'QTN-',
      },
    ]);
  }
};

exports.down = async function (knex) {
  await knex('settings').where({ group: 'sales_quotations' }).delete();
  await knex.schema.dropTableIfExists('sales_quotations');
};
