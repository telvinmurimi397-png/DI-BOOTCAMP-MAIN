exports.up = async (knex) => {
  await knex.schema.createTable('questions', (table) => {
    table.increments('id').primary();
    table.text('question').notNullable();
    table.text('correct_answer').notNullable();
  });

  await knex.schema.createTable('options', (table) => {
    table.increments('id').primary();
    table.text('option').notNullable();
  });

  await knex.schema.createTable('questions_options', (table) => {
    table.integer('question_id').notNullable()
      .references('id').inTable('questions').onDelete('CASCADE');
    table.integer('option_id').notNullable()
      .references('id').inTable('options').onDelete('CASCADE');
    table.primary(['question_id', 'option_id']);
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('questions_options');
  await knex.schema.dropTableIfExists('options');
  await knex.schema.dropTableIfExists('questions');
};