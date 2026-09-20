exports.up = async function (knex) {
  await knex.schema.createTable('pd_cheques', (table) => {
    table.increments();
    table.integer('customer_id').unsigned().notNullable().index();
    table.string('cheque_no').notNullable().index();
    table.string('document_no').notNullable().unique();
    table.decimal('amount', 13, 2).notNullable();
    table.decimal('allocated_amount', 13, 2).notNullable().defaultTo(0);
    table.decimal('advance_amount', 13, 2).notNullable().defaultTo(0);
    table.date('collected_date').notNullable();
    table.date('banking_date').notNullable();
    table.string('status', 24).notNullable().defaultTo('pending').index();
    table.integer('deposited_bank_id').unsigned().nullable().index();
    table.integer('realized_bank_id').unsigned().nullable().index();
    table.date('realized_at').nullable();
    table.date('returned_at').nullable();
    table.string('currency_code', 3).notNullable();
    table.decimal('exchange_rate', 13, 6).notNullable().defaultTo(1);
    table.integer('branch_id').unsigned().nullable().index();
    table.integer('user_id').unsigned().nullable().index();
    table.string('reference_no').nullable();
    table.text('statement').nullable();
    table.integer('cheques_account_id').unsigned().nullable().index();
    table.integer('advances_account_id').unsigned().nullable().index();
    table.timestamps();
  });

  await knex.schema.createTable('pd_cheque_entries', (table) => {
    table.increments();
    table.integer('pd_cheque_id').unsigned().notNullable().index();
    table.integer('invoice_id').unsigned().notNullable().index();
    table.decimal('payment_amount', 13, 2).notNullable();
    table.integer('index').unsigned().notNullable().defaultTo(1);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('pd_cheque_entries');
  await knex.schema.dropTableIfExists('pd_cheques');
};
