const questions = [
  {
    question: 'Which planet is known as the Red Planet?',
    correctAnswer: 'Mars',
    options: ['Venus', 'Mars', 'Jupiter', 'Mercury'],
  },
  {
    question: 'How many sides does a hexagon have?',
    correctAnswer: 'Six',
    options: ['Five', 'Six', 'Seven', 'Eight'],
  },
  {
    question: 'Which ocean is the largest?',
    correctAnswer: 'Pacific Ocean',
    options: ['Atlantic Ocean', 'Indian Ocean', 'Arctic Ocean', 'Pacific Ocean'],
  },
  {
    question: 'What is the chemical symbol for gold?',
    correctAnswer: 'Au',
    options: ['Ag', 'Gd', 'Au', 'Go'],
  },
  {
    question: 'Which instrument measures atmospheric pressure?',
    correctAnswer: 'Barometer',
    options: ['Thermometer', 'Anemometer', 'Hygrometer', 'Barometer'],
  },
];

exports.seed = async (knex) => {
  await knex.transaction(async (trx) => {
    await trx('questions_options').del();
    await trx('questions').del();
    await trx('options').del();

    for (const entry of questions) {
      const [question] = await trx('questions')
        .insert({ question: entry.question, correct_answer: entry.correctAnswer })
        .returning('id');
      const optionRows = await trx('options')
        .insert(entry.options.map((option) => ({ option })))
        .returning(['id', 'option']);

      await trx('questions_options').insert(
        optionRows.map((option) => ({ question_id: question.id, option_id: option.id })),
      );
    }
  });
};