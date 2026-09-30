const crypto = require('node:crypto');
const path = require('node:path');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;
const BOARD_SIZE = 10;
const OBSTACLES = [
  [1, 3], [1, 6], [2, 1], [2, 7], [3, 4], [3, 8],
  [4, 2], [4, 6], [5, 3], [5, 7], [6, 1], [6, 5],
  [7, 3], [7, 8], [8, 2], [8, 6]
];
const DIRECTIONS = {
  up: [-1, 0],
  down: [1, 0],
  left: [0, -1],
  right: [0, 1]
};

const playersByUsername = new Map();
const authTokens = new Map();
const games = new Map();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function sendError(res, status, message) {
  return res.status(status).json({ error: message });
}

function makeToken(playerId) {
  const token = crypto.randomBytes(32).toString('hex');
  authTokens.set(token, playerId);
  return token;
}

function authenticate(req, res, next) {
  const token = req.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  const playerId = token && authTokens.get(token);
  const player = playerId && [...playersByUsername.values()].find((item) => item.id === playerId);
  if (!player) return sendError(res, 401, 'Sign in to continue.');
  req.player = player;
  next();
}

function validateCredentials(body) {
  const username = typeof body?.username === 'string' ? body.username.trim() : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  if (!/^[a-zA-Z0-9_-]{3,18}$/.test(username)) {
    return { error: 'Username must be 3 to 18 letters, numbers, underscores, or hyphens.' };
  }
  if (password.length < 8 || password.length > 128) {
    return { error: 'Password must be between 8 and 128 characters.' };
  }
  return { username, password, usernameKey: username.toLowerCase() };
}

function publicPlayer(player) {
  return { id: player.id, username: player.username };
}

function findGame(req, res) {
  const game = games.get(String(req.params.gameId || '').toUpperCase());
  if (!game) {
    sendError(res, 404, 'Game not found. Check the invite code and try again.');
    return null;
  }
  return game;
}

function getSeat(game, playerId) {
  if (game.players.one.id === playerId) return 'one';
  if (game.players.two?.id === playerId) return 'two';
  return null;
}

function getOpponentSeat(seat) {
  return seat === 'one' ? 'two' : 'one';
}

function positionKey([row, column]) {
  return `${row},${column}`;
}

function isInsideBoard([row, column]) {
  return row >= 0 && row < BOARD_SIZE && column >= 0 && column < BOARD_SIZE;
}

function canMoveTo(game, seat, destination) {
  if (!isInsideBoard(destination)) return false;
  if (game.obstacles.has(positionKey(destination))) return false;
  if (positionKey(game.players[seat].base) === positionKey(destination)) return false;

  const opponent = game.players[getOpponentSeat(seat)];
  if (opponent && positionKey(opponent.position) === positionKey(destination)) {
    const opponentBase = positionKey(opponent.base);
    return positionKey(destination) === opponentBase;
  }
  return true;
}

function legalMoves(game, seat) {
  const [row, column] = game.players[seat].position;
  return Object.entries(DIRECTIONS)
    .filter(([, [rowStep, columnStep]]) => canMoveTo(game, seat, [row + rowStep, column + columnStep]))
    .map(([direction]) => direction);
}

function playerCanAttack(game, seat) {
  const targetBase = game.players[getOpponentSeat(seat)]?.base;
  if (!targetBase) return false;
  const [row, column] = game.players[seat].position;
  return Math.abs(row - targetBase[0]) + Math.abs(column - targetBase[1]) === 1;
}

function gameSnapshot(game, playerId) {
  const seat = getSeat(game, playerId);
  const isYourTurn = Boolean(seat && game.turn === seat && game.status === 'active');
  return {
    id: game.id,
    status: game.status,
    boardSize: BOARD_SIZE,
    players: {
      one: { ...publicPlayer(game.players.one.player), position: game.players.one.position, base: game.players.one.base },
      two: game.players.two
        ? { ...publicPlayer(game.players.two.player), position: game.players.two.position, base: game.players.two.base }
        : null
    },
    turn: game.status === 'waiting' ? null : game.players[game.turn].id,
    turnUsername: game.status === 'waiting' ? null : game.players[game.turn].player.username,
    currentPlayerId: playerId,
    winner: game.winner ? publicPlayer(game.winner.player) : null,
    obstacles: [...game.obstacles].map((entry) => entry.split(',').map(Number)),
    history: game.history.slice(-12),
    isYourTurn,
    legalMoves: isYourTurn ? legalMoves(game, seat) : [],
    canAttack: isYourTurn && playerCanAttack(game, seat)
  };
}

function addHistory(game, text, kind = 'move') {
  game.history.push({ text, kind, at: new Date().toISOString() });
  if (game.history.length > 60) game.history.shift();
}

app.post('/api/auth/register', (req, res) => {
  const credentials = validateCredentials(req.body);
  if (credentials.error) return sendError(res, 400, credentials.error);
  if (playersByUsername.has(credentials.usernameKey)) return sendError(res, 409, 'That username is already registered.');

  const salt = crypto.randomBytes(16);
  const player = {
    id: crypto.randomUUID(),
    username: credentials.username,
    usernameKey: credentials.usernameKey,
    salt,
    passwordHash: crypto.scryptSync(credentials.password, salt, 64)
  };
  playersByUsername.set(player.usernameKey, player);
  res.status(201).json({ token: makeToken(player.id), player: publicPlayer(player) });
});

app.post('/api/auth/login', (req, res) => {
  const credentials = validateCredentials(req.body);
  if (credentials.error) return sendError(res, 400, credentials.error);
  const player = playersByUsername.get(credentials.usernameKey);
  if (!player) return sendError(res, 401, 'Username or password is incorrect.');

  const passwordHash = crypto.scryptSync(credentials.password, player.salt, 64);
  if (!crypto.timingSafeEqual(passwordHash, player.passwordHash)) {
    return sendError(res, 401, 'Username or password is incorrect.');
  }
  res.json({ token: makeToken(player.id), player: publicPlayer(player) });
});

app.get('/api/me', authenticate, (req, res) => {
  res.json({ player: publicPlayer(req.player) });
});

app.post('/api/games', authenticate, (req, res) => {
  let id;
  do {
    id = crypto.randomBytes(3).toString('hex').toUpperCase();
  } while (games.has(id));

  const game = {
    id,
    status: 'waiting',
    turn: 'one',
    winner: null,
    players: {
      one: { id: req.player.id, player: req.player, position: [0, 1], base: [0, 0] },
      two: null
    },
    obstacles: new Set(OBSTACLES.map(positionKey)),
    history: []
  };
  addHistory(game, `${req.player.username} opened the game. Waiting for an opponent.`, 'system');
  games.set(id, game);
  res.status(201).json(gameSnapshot(game, req.player.id));
});

app.post('/api/games/:gameId/join', authenticate, (req, res) => {
  const game = findGame(req, res);
  if (!game) return;
  if (getSeat(game, req.player.id)) return res.json(gameSnapshot(game, req.player.id));
  if (game.status !== 'waiting' || game.players.two) return sendError(res, 409, 'This game is already full or finished.');

  game.players.two = { id: req.player.id, player: req.player, position: [9, 8], base: [9, 9] };
  game.status = 'active';
  addHistory(game, `${req.player.username} joined. ${game.players.one.player.username} takes the first turn.`, 'system');
  res.json(gameSnapshot(game, req.player.id));
});

app.get('/api/games/:gameId', authenticate, (req, res) => {
  const game = findGame(req, res);
  if (!game) return;
  if (!getSeat(game, req.player.id)) return sendError(res, 403, 'You are not a player in this game.');
  res.json(gameSnapshot(game, req.player.id));
});

app.post('/api/games/:gameId/moves', authenticate, (req, res) => {
  const game = findGame(req, res);
  if (!game) return;
  const seat = getSeat(game, req.player.id);
  if (!seat) return sendError(res, 403, 'You are not a player in this game.');
  if (game.status !== 'active') return sendError(res, 409, 'This game is waiting for an opponent or has finished.');
  if (game.turn !== seat) return sendError(res, 409, 'Wait for your turn.');

  const direction = req.body?.direction;
  if (!Object.hasOwn(DIRECTIONS, direction)) return sendError(res, 400, 'Choose up, down, left, or right.');

  const [rowStep, columnStep] = DIRECTIONS[direction];
  const [row, column] = game.players[seat].position;
  const destination = [row + rowStep, column + columnStep];
  if (!isInsideBoard(destination)) return sendError(res, 400, 'That move would leave the board.');
  if (game.obstacles.has(positionKey(destination))) return sendError(res, 400, 'An obstacle blocks that square.');
  if (positionKey(game.players[seat].base) === positionKey(destination)) {
    return sendError(res, 400, 'You cannot move onto your own base.');
  }

  const opponentSeat = getOpponentSeat(seat);
  const opponent = game.players[opponentSeat];
  if (positionKey(opponent.position) === positionKey(destination) && positionKey(opponent.base) !== positionKey(destination)) {
    return sendError(res, 400, 'The other player blocks that square.');
  }

  game.players[seat].position = destination;
  if (positionKey(destination) === positionKey(opponent.base)) {
    game.status = 'finished';
    game.winner = game.players[seat];
    addHistory(game, `${req.player.username} captured the base and won!`, 'win');
  } else {
    addHistory(game, `${req.player.username} moved ${direction}.`);
    game.turn = opponentSeat;
  }
  res.json(gameSnapshot(game, req.player.id));
});

app.post('/api/games/:gameId/attack', authenticate, (req, res) => {
  const game = findGame(req, res);
  if (!game) return;
  const seat = getSeat(game, req.player.id);
  if (!seat) return sendError(res, 403, 'You are not a player in this game.');
  if (game.status !== 'active') return sendError(res, 409, 'This game is waiting for an opponent or has finished.');
  if (game.turn !== seat) return sendError(res, 409, 'Wait for your turn.');
  if (!playerCanAttack(game, seat)) return sendError(res, 400, 'Move next to the opponent base before attacking.');

  const opponentSeat = getOpponentSeat(seat);
  game.status = 'finished';
  game.winner = game.players[seat];
  addHistory(game, `${req.player.username} attacked and captured the base!`, 'win');
  res.json(gameSnapshot(game, req.player.id));
});

app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return sendError(res, 400, 'Request body must contain valid JSON.');
  }
  console.error(error);
  sendError(res, 500, 'An unexpected server error occurred.');
});

if (require.main === module) {
  app.listen(PORT, () => console.log(`Multiplayer Strategy is running at http://localhost:${PORT}`));
}

module.exports = { app, games, playersByUsername };