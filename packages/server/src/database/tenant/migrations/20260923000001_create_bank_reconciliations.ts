exports.up = async function (knex) {
  await knex.schema.createTable('bank_reconciliations', (table) => {
    table.increments();
    table.integer('account_id').unsigned().notNullable().index();
    table.string('period_month', 7).notNullable().index();
    table.date('start_date').notNullable();
    table.date('end_date').notNullable();
    table.decimal('beginning_balance', 15, 2).notNullable().defaultTo(0);
    table.decimal('ending_balance', 15, 2).notNullable().defaultTo(0);
    table.string('status', 16).notNullable().defaultTo('draft').index();
    table.datetime('closed_at').nullable();
    table.datetime('reopened_at').nullable();
    table.integer('created_by').unsigned().nullable();
    table.integer('closed_by').unsigned().nullable();
    table.timestamps();
  });

  await knex.schema.createTable('bank_reconciliation_lines', (table) => {
    table.increments();
    table
      .integer('reconciliation_id')
      .unsigned()
      .notNullable()
      .index();
    table
      .integer('account_transaction_id')
      .unsigned()
      .notNullable()
      .index();
    table.boolean('ticked').notNullable().defaultTo(false);
    table.unique(['reconciliation_id', 'account_transaction_id']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('bank_reconciliation_lines');
  await knex.schema.dropTableIfExists('bank_reconciliations');
};
