const express = require('express');
const session = require('express-session');
const path = require('node:path');

const app = express();
const port = process.env.PORT || 3000;
const roundsPerGame = 10;
const emojis = [
  { emoji: '😀', name: 'Smile' },
  { emoji: '🐶', name: 'Dog' },
  { emoji: '🌮', name: 'Taco' },
  { emoji: '🍉', name: 'Watermelon' },
  { emoji: '🚀', name: 'Rocket' },
  { emoji: '🦋', name: 'Butterfly' },
  { emoji: '🎸', name: 'Guitar' },
  { emoji: '🍕', name: 'Pizza' },
  { emoji: '🐙', name: 'Octopus' },
  { emoji: '🌈', name: 'Rainbow' },
  { emoji: '🧁', name: 'Cupcake' },
  { emoji: '🦒', name: 'Giraffe' },
  { emoji: '⚽', name: 'Soccer ball' },
  { emoji: '🍄', name: 'Mushroom' },
  { emoji: '🛶', name: 'Canoe' },
  { emoji: '🦉', name: 'Owl' },
  { emoji: '🧲', name: 'Magnet' },
  { emoji: '🎈', name: 'Balloon' },
  { emoji: '🥑', name: 'Avocado' },
  { emoji: '🧸', name: 'Teddy bear' }
];
const leaderboard = [];

app.use(express.json());
app.use(session({
  name: 'emoji-game.sid',
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

function makeRound(game) {
  const correct = emojis[Math.floor(Math.random() * emojis.length)];
  const distractors = shuffle(emojis.filter((item) => item.name !== correct.name)).slice(0, 3);
  game.current = { emoji: correct.emoji, answer: correct.name, choices: shuffle([correct, ...distractors]).map((item) => item.name) };
  game.answered = false;
  return {
    emoji: game.current.emoji,
    choices: game.current.choices,
    round: game.round,
    total: roundsPerGame,
    score: game.score
  };
}

function getLeaderboard() {
  return leaderboard.slice(0, 10).map((entry, index) => ({ rank: index + 1, name: entry.name, score: entry.score }));
}

app.get('/api/leaderboard', (req, res) => {
  res.json(getLeaderboard());
});

app.post('/api/game/start', (req, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim().slice(0, 18) : '';
  if (!name) return res.status(400).json({ error: 'Enter a name to start the game' });

  req.session.game = { name, score: 0, round: 1, answered: false, current: null };
  res.status(201).json(makeRound(req.session.game));
});

app.post('/api/game/guess', (req, res) => {
  const game = req.session.game;
  if (!game) return res.status(409).json({ error: 'Start a game first' });
  if (game.round > roundsPerGame) return res.status(409).json({ error: 'This game is complete' });
  if (game.answered) return res.status(409).json({ error: 'This emoji has already been answered' });

  const guess = req.body?.guess;
  if (typeof guess !== 'string' || !game.current.choices.includes(guess)) {
    return res.status(400).json({ error: 'Choose one of the available options' });
  }

  const correct = guess === game.current.answer;
  if (correct) game.score += 1;
  game.answered = true;
  const isComplete = game.round === roundsPerGame;

  if (isComplete) {
    leaderboard.push({ name: game.name, score: game.score, playedAt: Date.now() });
    leaderboard.sort((first, second) => second.score - first.score || first.playedAt - second.playedAt);
    leaderboard.splice(10);
  }

  res.json({
    correct,
    answer: game.current.answer,
    score: game.score,
    round: game.round,
    total: roundsPerGame,
    isComplete,
    leaderboard: isComplete ? getLeaderboard() : undefined
  });
});

app.post('/api/game/next', (req, res) => {
  const game = req.session.game;
  if (!game) return res.status(409).json({ error: 'Start a game first' });
  if (!game.answered) return res.status(409).json({ error: 'Submit your guess first' });
  if (game.round >= roundsPerGame) return res.status(409).json({ error: 'This game is complete' });

  game.round += 1;
  res.json(makeRound(game));
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
  console.log(`Emoji guessing game is running at http://localhost:${port}`);
});