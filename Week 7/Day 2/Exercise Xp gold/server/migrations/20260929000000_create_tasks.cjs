exports.up = (knex) => knex.schema.createTable('tasks', (table) => {
  table.increments('id').primary();
  table.string('title').notNullable();
  table.boolean('completed').notNullable().defaultTo(false);
  table.timestamps(true, true);
});

exports.down = (knex) => knex.schema.dropTableIfExists('tasks');