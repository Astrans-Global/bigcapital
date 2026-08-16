// The customer form already has a dedicated Contact Name (salutation +
// first/last name) section — a separate free-text "Contact Person" field
// was redundant and has been removed.
exports.up = async function (knex) {
  const hasColumn = await knex.schema.hasColumn('contacts', 'contact_person');
  if (hasColumn) {
    await knex.schema.alterTable('contacts', (table) => {
      table.dropColumn('contact_person');
    });
  }
};

exports.down = async function (knex) {
  await knex.schema.alterTable('contacts', (table) => {
    table.string('contact_person').nullable();
  });
};
