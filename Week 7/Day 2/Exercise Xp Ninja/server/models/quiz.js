const db = require('../config/db');

async function listQuestions() {
  const rows = await db('questions')
    .join('questions_options', 'questions.id', 'questions_options.question_id')
    .join('options', 'questions_options.option_id', 'options.id')
    .select(
      'questions.id as questionId',
      'questions.question',
      'options.id as optionId',
      'options.option',
    )
    .orderBy(['questions.id', 'options.id']);

  const questions = new Map();
  for (const row of rows) {
    if (!questions.has(row.questionId)) {
      questions.set(row.questionId, {
        id: row.questionId,
        question: row.question,
        options: [],
      });
    }
    questions.get(row.questionId).options.push({
      id: row.optionId,
      option: row.option,
    });
  }

  return [...questions.values()];
}

async function checkAnswer(questionId, optionId) {
  return db('questions')
    .join('questions_options', 'questions.id', 'questions_options.question_id')
    .join('options', 'questions_options.option_id', 'options.id')
    .where({ 'questions.id': questionId, 'options.id': optionId })
    .select('questions.correct_answer', 'options.option as selected_option')
    .first();
}

module.exports = { listQuestions, checkAnswer };