const express = require('express');
const session = require('express-session');
const quizRouter = require('./routes/quiz');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: false }));
app.use(session({
  name: 'trivia-quiz.sid',
  secret: process.env.SESSION_SECRET || 'development-only-change-before-deploy',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 1000
  }
}));

app.use('/quiz', quizRouter);

if (require.main === module) {
  app.listen(port, () => {
    if (!process.env.SESSION_SECRET) {
      console.warn('SESSION_SECRET is not set; using a development-only secret.');
    }
    console.log(`Trivia quiz is running at http://localhost:${port}/quiz`);
  });
}

module.exports = app;