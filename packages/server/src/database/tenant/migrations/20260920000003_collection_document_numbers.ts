exports.up = async function (knex) {
  const rows = [
    {
      group: 'payment_receives_cash',
      prefix: 'CIH-',
      suffix: '',
      next: '00001',
    },
    {
      group: 'payment_receives_bank_transfer',
      prefix: 'PAY-',
      suffix: '-BT',
      next: '00001',
    },
    {
      group: 'payment_receives_bank_deposit',
      prefix: 'PAY-',
      suffix: '-BD',
      next: '00001',
    },
  ];

  const insertIfMissing = async (group, key, value) => {
    const existing = await knex('settings').where({ group, key }).first();
    if (existing) {
      return;
    }
    await knex('settings').insert({ group, key, value });
  };

  for (const row of rows) {
    await insertIfMissing(row.group, 'number_prefix', row.prefix);
    await insertIfMissing(row.group, 'number_suffix', row.suffix);
    await insertIfMissing(row.group, 'next_number', row.next);
    await insertIfMissing(row.group, 'auto_increment', true);
  }

  await knex('settings')
    .where({ group: 'payment_receives', key: 'auto_increment' })
    .update({ value: true });
};

exports.down = async function (knex) {
  await knex('settings')
    .whereIn('group', [
      'payment_receives_cash',
      'payment_receives_bank_transfer',
      'payment_receives_bank_deposit',
    ])
    .del();
  await knex('settings').where('group', 'like', 'pd_cheques%').del();
};
