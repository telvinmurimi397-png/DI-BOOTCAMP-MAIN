const quiz = require('../models/quiz');

function positiveInteger(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

async function getQuestions(req, res) {
  res.json(await quiz.listQuestions());
}

async function submitAnswer(req, res) {
  const questionId = positiveInteger(req.body?.questionId);
  const optionId = positiveInteger(req.body?.optionId);
  if (!questionId || !optionId) {
    return res.status(400).json({ error: 'questionId and optionId must be positive integers' });
  }

  const answer = await quiz.checkAnswer(questionId, optionId);
  if (!answer) return res.status(404).json({ error: 'Question or option not found' });

  res.json({
    correct: answer.selected_option === answer.correct_answer,
    correctAnswer: answer.correct_answer,
  });
}

module.exports = { getQuestions, submitAnswer };