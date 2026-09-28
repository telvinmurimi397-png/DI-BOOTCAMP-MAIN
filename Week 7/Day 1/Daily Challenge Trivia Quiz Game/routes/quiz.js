const express = require('express');

const router = express.Router();
const triviaQuestions = [
  { question: 'What is the capital of France?', answer: 'Paris' },
  { question: 'Which planet is known as the Red Planet?', answer: 'Mars' },
  { question: 'What is the largest mammal in the world?', answer: 'Blue whale' }
];

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

function page(title, content) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <style>
    :root { color-scheme: light; font-family: Georgia, 'Times New Roman', serif; color: #242c29; background: #f4f2e9; }
    * { box-sizing: border-box; }
    body { min-height: 100vh; margin: 0; display: grid; place-items: center; padding: 24px; background: radial-gradient(circle at 12% 18%, #d8e5da 0, transparent 30%), radial-gradient(circle at 88% 82%, #f0d5c7 0, transparent 28%), #f4f2e9; }
    main { width: min(100%, 600px); padding: clamp(26px, 6vw, 48px); border: 1px solid #d8d6ca; background: rgba(255, 255, 252, .92); box-shadow: 12px 12px 0 #dfe4da; }
    .eyebrow { margin: 0 0 12px; color: #527065; font: 700 11px/1.4 Arial, sans-serif; letter-spacing: .12em; text-transform: uppercase; }
    h1 { margin: 0; font-size: clamp(30px, 7vw, 44px); line-height: 1.12; }
    .progress { margin: 16px 0 28px; color: #6d756f; font: 12px Arial, sans-serif; }
    .feedback, .error { margin: 20px 0; padding: 13px 15px; border-left: 3px solid #3c765b; background: #e7f0e6; font: 15px/1.5 Arial, sans-serif; }
    .feedback.wrong, .error { border-left-color: #b75a43; background: #f8e9e2; }
    label { display: block; margin: 26px 0 8px; font: 700 13px Arial, sans-serif; }
    input { width: 100%; min-height: 48px; padding: 10px 12px; border: 1px solid #bfc8bd; border-radius: 0; background: #fff; color: #242c29; font: 16px Arial, sans-serif; }
    input:focus-visible, button:focus-visible, a:focus-visible { outline: 3px solid #d78654; outline-offset: 3px; }
    button, .link { min-height: 48px; display: inline-flex; align-items: center; justify-content: center; margin-top: 20px; padding: 0 21px; border: 0; background: #285d4a; color: white; font: 700 14px Arial, sans-serif; text-decoration: none; cursor: pointer; }
    button:hover, .link:hover { background: #194737; }
    .score { margin: 24px 0 10px; color: #285d4a; font-size: clamp(40px, 10vw, 66px); line-height: 1; }
    .summary { color: #58655e; font: 15px/1.6 Arial, sans-serif; }
  </style>
</head>
<body>
  ${content}
</body>
</html>`;
}

function renderQuestion(quiz, error = '') {
  const question = triviaQuestions[quiz.index];
  const feedback = quiz.feedback
    ? `<p class="feedback${quiz.feedback.correct ? '' : ' wrong'}" role="status">${quiz.feedback.message}</p>`
    : '';
  const errorMessage = error ? `<p class="error" role="alert">${error}</p>` : '';

  return page('Trivia Quiz', `<main>
    <p class="eyebrow">Quick trivia</p>
    <h1>${escapeHtml(question.question)}</h1>
    <p class="progress">Question ${quiz.index + 1} of ${triviaQuestions.length} <span aria-hidden="true">·</span> Score: ${quiz.score}</p>
    ${feedback}
    ${errorMessage}
    <form action="/quiz" method="post">
      <label for="answer">Your answer</label>
      <input id="answer" name="answer" type="text" autocomplete="off" required autofocus>
      <button type="submit">Submit answer</button>
    </form>
  </main>`);
}

// Start the quiz, or resume the current session's question.
router.get('/', (req, res) => {
  if (!req.session.quiz || req.session.quiz.completed) {
    req.session.quiz = { index: 0, score: 0, feedback: null, completed: false };
  }
  res.type('html').send(renderQuestion(req.session.quiz));
});

// Check the submitted answer, update the score, and advance one question.
router.post('/', (req, res) => {
  const quiz = req.session.quiz;
  if (!quiz || quiz.completed) return res.redirect('/quiz');

  const answer = typeof req.body?.answer === 'string' ? req.body.answer.trim() : '';
  if (!answer) {
    return res.status(400).type('html').send(renderQuestion(quiz, 'Enter an answer before continuing.'));
  }

  const question = triviaQuestions[quiz.index];
  const normalize = (value) => value.trim().replace(/\s+/g, ' ').toLowerCase();
  const correct = normalize(answer) === normalize(question.answer);
  if (correct) quiz.score += 1;
  quiz.feedback = {
    correct,
    message: correct ? 'Correct!' : `Not quite. The answer is ${escapeHtml(question.answer)}.`
  };
  quiz.index += 1;

  if (quiz.index >= triviaQuestions.length) {
    quiz.completed = true;
    return res.redirect('/quiz/score');
  }
  res.redirect('/quiz');
});

// Show the session's final score after all questions are answered.
router.get('/score', (req, res) => {
  const quiz = req.session.quiz;
  if (!quiz || !quiz.completed) return res.redirect('/quiz');

  const feedback = quiz.feedback
    ? `<p class="feedback${quiz.feedback.correct ? '' : ' wrong'}" role="status">${quiz.feedback.message}</p>`
    : '';
  const content = `<main>
    <p class="eyebrow">Quiz complete</p>
    <h1>Your final score</h1>
    <p class="score">${quiz.score}<span class="summary"> / ${triviaQuestions.length}</span></p>
    ${feedback}
    <p class="summary">${quiz.score === triviaQuestions.length ? 'Perfect score. Nicely done!' : 'Thanks for playing. Try again and see if you can beat your score.'}</p>
    <a class="link" href="/quiz">Play again</a>
  </main>`;
  res.type('html').send(page('Trivia Quiz Score', content));
});

module.exports = router;