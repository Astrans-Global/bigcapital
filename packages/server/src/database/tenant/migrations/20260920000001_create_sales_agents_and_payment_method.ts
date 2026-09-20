exports.up = async function (knex) {
  await knex.schema.createTable('sales_agents', (table) => {
    table.increments();
    table.string('name').notNullable();
    table.integer('cash_account_id').unsigned().index();
    table.boolean('active').notNullable().defaultTo(true);
    table.integer('user_id').unsigned().index();
    table.timestamps();

    table.unique(['name']);
  });

  await knex.schema.alterTable('payment_receives', (table) => {
    table.integer('agent_id').unsigned().nullable().index();
    table.string('payment_method', 32).nullable().index();
    table.datetime('deposited_at').nullable();
    table.integer('deposited_bank_id').unsigned().nullable().index();
  });

  const insertAccountIfMissing = async (row) => {
    const existing = await knex('accounts').where('slug', row.slug).first();
    if (existing) {
      return;
    }
    await knex('accounts').insert({
      name: row.name,
      slug: row.slug,
      account_type: row.account_type,
      code: row.code,
      description: row.description,
      active: 1,
      index: 1,
      predefined: 0,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    });
  };

  await insertAccountIfMissing({
    name: 'Cheques in Hand',
    slug: 'cheques-in-hand',
    account_type: 'other-current-asset',
    code: '1715',
    description: 'Post-dated cheques received, not yet realized.',
  });

  await insertAccountIfMissing({
    name: 'Customer Advances',
    slug: 'customer-advances',
    account_type: 'other-current-liability',
    code: '2310',
    description: 'Unallocated overpay on post-dated cheques until realized.',
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('payment_receives', (table) => {
    table.dropColumn('agent_id');
    table.dropColumn('payment_method');
    table.dropColumn('deposited_at');
    table.dropColumn('deposited_bank_id');
  });
  await knex.schema.dropTableIfExists('sales_agents');
};
