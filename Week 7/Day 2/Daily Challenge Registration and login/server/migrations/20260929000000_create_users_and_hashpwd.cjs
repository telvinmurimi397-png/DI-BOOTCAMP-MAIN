exports.up = async (knex) => {
  await knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('email').notNullable().unique();
    table.string('username').notNullable().unique();
    table.string('first_name');
    table.string('last_name');
    table.timestamps(true, true);
  });

  await knex.schema.createTable('hashpwd', (table) => {
    table.increments('id').primary();
    table.integer('user_id').notNullable().unique()
      .references('id').inTable('users').onDelete('CASCADE');
    table.string('username').notNullable().unique();
    table.string('password').notNullable();
    table.timestamps(true, true);
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('hashpwd');
  await knex.schema.dropTableIfExists('users');
};