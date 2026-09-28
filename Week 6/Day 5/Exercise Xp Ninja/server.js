const express = require('express');
const session = require('express-session');
const path = require('node:path');

const app = express();
const port = process.env.PORT || 3000;
const questions = [
  {
    prompt: 'Which array method creates a new array by transforming every item?',
    choices: ['forEach()', 'map()', 'find()', 'some()'],
    answer: 1,
    explanation: 'map() returns a new array containing the result of applying a function to each item.'
  },
  {
    prompt: 'What does HTTP status code 404 mean?',
    choices: ['Request succeeded', 'Server error', 'Resource not found', 'Access forbidden'],
    answer: 2,
    explanation: 'A 404 response means the server could not find the requested resource.'
  },
  {
    prompt: 'Which keyword declares a block-scoped variable that can be reassigned?',
    choices: ['const', 'var', 'let', 'static'],
    answer: 2,
    explanation: 'let is block-scoped and can be reassigned. const is block-scoped but cannot be reassigned.'
  },
  {
    prompt: 'In Express, what does middleware do?',
    choices: ['Styles the page', 'Runs during the request-response cycle', 'Stores files on disk', 'Compiles JavaScript'],
    answer: 1,
    explanation: 'Middleware functions can inspect or change the request and response, end the cycle, or pass control onward.'
  },
  {
    prompt: 'Which value represents the intentional absence of an object value in JavaScript?',
    choices: ['undefined', 'NaN', 'null', 'false'],
    answer: 2,
    explanation: 'null is an explicitly assigned value that represents no object value.'
  },
  {
    prompt: 'What does JSON.parse() do?',
    choices: ['Turns an object into JSON text', 'Turns JSON text into a JavaScript value', 'Sends an HTTP request', 'Checks whether text is valid HTML'],
    answer: 1,
    explanation: 'JSON.parse() reads JSON-formatted text and returns the corresponding JavaScript value.'
  }
];

app.use(express.json());
app.use(session({
  name: 'quiz.sid',
  secret: process.env.SESSION_SECRET || 'development-secret-change-before-deploy',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 1000 }
}));
app.use(express.static(path.join(__dirname, 'public')));

function shuffle(items) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function getCurrentQuestion(quiz) {
  const question = quiz.questions[quiz.index];
  if (!question) return null;

  const result = {
    prompt: question.prompt,
    choices: question.choices,
    index: quiz.index,
    total: quiz.questions.length,
    score: quiz.score,
    answered: quiz.answered
  };

  if (quiz.answered) {
    result.correctAnswer = question.answer;
    result.explanation = question.explanation;
  }

  return result;
}

app.post('/api/quiz/start', (req, res) => {
  req.session.quiz = {
    questions: shuffle(questions),
    index: 0,
    score: 0,
    answered: false
  };
  res.status(201).json(getCurrentQuestion(req.session.quiz));
});

app.get('/api/quiz/current', (req, res) => {
  if (!req.session.quiz) return res.status(409).json({ error: 'Start a quiz first' });
  res.json(getCurrentQuestion(req.session.quiz));
});

app.post('/api/quiz/answer', (req, res) => {
  const quiz = req.session.quiz;
  if (!quiz) return res.status(409).json({ error: 'Start a quiz first' });
  if (quiz.answered) return res.status(409).json({ error: 'This question has already been answered' });

  const selectedAnswer = req.body?.answer;
  const question = quiz.questions[quiz.index];
  if (!Number.isInteger(selectedAnswer) || selectedAnswer < 0 || selectedAnswer >= question.choices.length) {
    return res.status(400).json({ error: 'Choose one of the available answers' });
  }

  const correct = selectedAnswer === question.answer;
  if (correct) quiz.score += 1;
  quiz.answered = true;

  res.json({
    correct,
    correctAnswer: question.answer,
    explanation: question.explanation,
    score: quiz.score,
    isComplete: quiz.index === quiz.questions.length - 1
  });
});

app.post('/api/quiz/next', (req, res) => {
  const quiz = req.session.quiz;
  if (!quiz) return res.status(409).json({ error: 'Start a quiz first' });
  if (!quiz.answered) return res.status(409).json({ error: 'Answer the current question first' });
  if (quiz.index >= quiz.questions.length - 1) {
    return res.status(409).json({ error: 'The quiz is complete' });
  }

  quiz.index += 1;
  quiz.answered = false;
  res.json(getCurrentQuestion(quiz));
});

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(error.status || 500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
  if (!process.env.SESSION_SECRET) {
    console.warn('SESSION_SECRET is not set; using a development-only secret.');
  }
  console.log(`Quiz game is running at http://localhost:${port}`);
});