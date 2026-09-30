const authScreen = document.querySelector('#auth-screen');
const commandCenter = document.querySelector('#command-center');
const authForm = document.querySelector('#auth-form');
const authError = document.querySelector('#auth-error');
const authTitle = document.querySelector('#auth-title');
const authSubmit = document.querySelector('#auth-submit');
const authPassword = document.querySelector('#auth-password');
const lobby = document.querySelector('#lobby');
const gameScreen = document.querySelector('#game-screen');
const gameBoard = document.querySelector('#game-board');
const toast = document.querySelector('#toast');
let authMode = 'login';
let token = localStorage.getItem('outpost-token') || '';
let currentPlayer = null;
let currentGame = null;
let pollTimer = null;
let toastTimer = null;

async function api(path, options = {}) {
  const headers = { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers };
  const response = await fetch(`/api${path}`, { ...options, headers });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'The request could not be completed.');
  return payload;
}

function setAuthMode(mode) {
  authMode = mode;
  document.querySelectorAll('.auth-tab').forEach((button) => {
    const selected = button.dataset.mode === mode;
    button.classList.toggle('active', selected);
    button.setAttribute('aria-selected', String(selected));
  });
  authTitle.textContent = mode === 'login' ? 'Welcome back.' : 'Join the field.';
  authSubmit.innerHTML = mode === 'login' ? 'SIGN IN <span aria-hidden="true">↗</span>' : 'CREATE ACCOUNT <span aria-hidden="true">↗</span>';
  authPassword.autocomplete = mode === 'login' ? 'current-password' : 'new-password';
  authError.textContent = '';
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 3000);
}

function showCommandCenter() {
  authScreen.hidden = true;
  commandCenter.hidden = false;
  document.querySelector('#player-call-sign').textContent = currentPlayer.username.toUpperCase();
}

function stopPolling() {
  clearInterval(pollTimer);
  pollTimer = null;
}

function showLobby(message = '') {
  stopPolling();
  currentGame = null;
  lobby.hidden = false;
  gameScreen.hidden = true;
  document.querySelector('#lobby-message').textContent = message;
}

function seatForCurrentPlayer(game) {
  if (game.players.one.id === game.currentPlayerId) return 'one';
  if (game.players.two?.id === game.currentPlayerId) return 'two';
  return null;
}

function cellKey(position) {
  return position.join(',');
}

function renderBoard(game) {
  const seat = seatForCurrentPlayer(game);
  const yourPlayer = seat ? game.players[seat] : null;
  const legalDestinations = new Set();
  const steps = { up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1] };
  if (game.isYourTurn && yourPlayer) {
    game.legalMoves.forEach((direction) => {
      const [rowStep, columnStep] = steps[direction];
      legalDestinations.add(cellKey([yourPlayer.position[0] + rowStep, yourPlayer.position[1] + columnStep]));
    });
  }

  const obstacleCells = new Set(game.obstacles.map(cellKey));
  const baseCells = new Map([
    [cellKey(game.players.one.base), { owner: 'one', label: '01' }],
    [cellKey(game.players.two?.base || [9, 9]), { owner: 'two', label: '02' }]
  ]);
  const playerCells = new Map([
    [cellKey(game.players.one.position), { seat: 'one', name: game.players.one.username }]
  ]);
  if (game.players.two) playerCells.set(cellKey(game.players.two.position), { seat: 'two', name: game.players.two.username });

  const cells = [];
  for (let row = 0; row < game.boardSize; row += 1) {
    for (let column = 0; column < game.boardSize; column += 1) {
      const key = `${row},${column}`;
      const base = baseCells.get(key);
      const player = playerCells.get(key);
      const obstacle = obstacleCells.has(key);
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = `board-cell ${(row + column) % 2 ? 'cell-light' : 'cell-dark'}`;
      cell.setAttribute('role', 'gridcell');
      cell.setAttribute('aria-label', `Row ${row + 1}, column ${column + 1}${base ? `, player ${base.label} base` : ''}${obstacle ? ', obstacle' : ''}${player ? `, ${player.name}` : ''}`);
      cell.dataset.row = String(row);
      cell.dataset.column = String(column);

      if (base) {
        cell.classList.add(`base-${base.owner}`);
        const baseLabel = document.createElement('span');
        baseLabel.className = 'base-label';
        baseLabel.textContent = 'HQ';
        cell.append(baseLabel);
      }
      if (obstacle) {
        cell.classList.add('obstacle-cell');
        const obstacleMark = document.createElement('span');
        obstacleMark.className = 'obstacle-mark';
        obstacleMark.setAttribute('aria-hidden', 'true');
        cell.append(obstacleMark);
      }
      if (player) {
        const piece = document.createElement('span');
        piece.className = `piece piece-${player.seat}`;
        piece.textContent = player.seat === 'one' ? '01' : '02';
        cell.append(piece);
      }
      if (legalDestinations.has(key)) {
        cell.classList.add('legal-cell');
        cell.disabled = false;
      } else {
        cell.disabled = true;
      }
      cells.push(cell);
    }
  }
  gameBoard.replaceChildren(...cells);
}

function formatPosition(position) {
  return `GRID ${String(position[0] + 1).padStart(2, '0')} / ${String(position[1] + 1).padStart(2, '0')}`;
}

function renderHistory(history) {
  const list = document.querySelector('#game-history');
  list.replaceChildren();
  if (!history.length) {
    const item = document.createElement('li');
    item.className = 'history-empty';
    item.textContent = 'No moves recorded.';
    list.append(item);
    return;
  }
  history.slice().reverse().forEach((entry, index) => {
    const item = document.createElement('li');
    item.className = `history-entry ${entry.kind === 'win' ? 'win-entry' : ''}`;
    const number = document.createElement('span');
    number.className = 'history-index';
    number.textContent = String(history.length - index).padStart(2, '0');
    const text = document.createElement('span');
    text.textContent = entry.text;
    item.append(number, text);
    list.append(item);
  });
}

function renderGame(game) {
  currentGame = game;
  lobby.hidden = true;
  gameScreen.hidden = false;
  document.querySelector('#active-game-code').textContent = game.id;
  document.querySelector('#game-status').textContent = game.status === 'waiting' ? 'WAITING' : game.status === 'finished' ? 'COMPLETE' : 'IN PLAY';
  document.querySelector('#game-status').className = `game-status status-${game.status}`;
  document.querySelector('#player-one-name').textContent = game.players.one.username;
  document.querySelector('#player-one-coordinates').textContent = formatPosition(game.players.one.position);
  document.querySelector('#player-two-name').textContent = game.players.two?.username || 'AWAITING PLAYER';
  document.querySelector('#player-two-coordinates').textContent = game.players.two ? formatPosition(game.players.two.position) : 'BASE 10 / 10';
  document.querySelector('#turn-number').textContent = `TURN ${String(game.history.length).padStart(2, '0')}`;

  const boardTitle = document.querySelector('#board-title');
  const turnChip = document.querySelector('#turn-chip');
  const waiting = game.status === 'waiting';
  const finished = game.status === 'finished';
  const yourTurn = game.isYourTurn;
  if (waiting) {
    boardTitle.textContent = 'Waiting on second player';
    turnChip.innerHTML = '<span class="signal-dot"></span> WAITING';
  } else if (finished) {
    boardTitle.textContent = game.winner.id === game.currentPlayerId ? 'You captured the outpost.' : `${game.winner.username} captured the outpost.`;
    turnChip.innerHTML = `<span class="signal-dot"></span> ${game.winner.id === game.currentPlayerId ? 'VICTORY' : 'DEFEAT'}`;
    turnChip.classList.toggle('victory-chip', game.winner.id === game.currentPlayerId);
  } else {
    boardTitle.textContent = yourTurn ? 'Your move.' : `${game.turnUsername} is planning a move.`;
    turnChip.innerHTML = `<span class="signal-dot"></span> ${yourTurn ? 'YOUR TURN' : 'OPPONENT TURN'}`;
    turnChip.classList.toggle('victory-chip', false);
  }

  const currentSeat = seatForCurrentPlayer(game);
  document.querySelector('#player-one-card').classList.toggle('active-player', game.status === 'active' && game.turn === 'one');
  document.querySelector('#player-two-card').classList.toggle('active-player', game.status === 'active' && game.turn === 'two');
  document.querySelector('#waiting-card').hidden = !waiting;
  document.querySelector('#move-card').hidden = waiting || finished || !currentSeat;
  document.querySelectorAll('.direction-button[data-direction]').forEach((button) => {
    button.disabled = !yourTurn || !game.legalMoves.includes(button.dataset.direction);
  });
  document.querySelector('#attack-button').hidden = !game.canAttack;
  renderBoard(game);
  renderHistory(game.history);
}

async function loadGame() {
  if (!currentGame) return;
  try {
    const game = await api(`/games/${currentGame.id}`);
    if (JSON.stringify(game) !== JSON.stringify(currentGame)) renderGame(game);
  } catch (error) {
    showToast(error.message);
  }
}

function startPolling() {
  stopPolling();
  pollTimer = setInterval(loadGame, 1400);
}

async function openGame(game) {
  renderGame(game);
  startPolling();
}

async function makeMove(direction) {
  if (!currentGame) return;
  try {
    const game = await api(`/games/${currentGame.id}/moves`, { method: 'POST', body: JSON.stringify({ direction }) });
    renderGame(game);
  } catch (error) {
    showToast(error.message);
    loadGame();
  }
}

document.querySelectorAll('.auth-tab').forEach((button) => button.addEventListener('click', () => setAuthMode(button.dataset.mode)));

authForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  authError.textContent = '';
  authSubmit.disabled = true;
  try {
    const result = await api(`/auth/${authMode === 'register' ? 'register' : 'login'}`, {
      method: 'POST',
      body: JSON.stringify({ username: document.querySelector('#auth-username').value, password: authPassword.value })
    });
    token = result.token;
    currentPlayer = result.player;
    localStorage.setItem('outpost-token', token);
    showCommandCenter();
  } catch (error) {
    authError.textContent = error.message;
  } finally {
    authSubmit.disabled = false;
  }
});

document.querySelector('#create-game-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    await openGame(await api('/games', { method: 'POST', body: '{}' }));
  } catch (error) {
    document.querySelector('#lobby-message').textContent = error.message;
  }
});

document.querySelector('#join-game-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const id = document.querySelector('#game-code').value.trim().toUpperCase();
  try {
    await openGame(await api(`/games/${encodeURIComponent(id)}/join`, { method: 'POST', body: '{}' }));
  } catch (error) {
    document.querySelector('#lobby-message').textContent = error.message;
  }
});

document.querySelector('.direction-pad').addEventListener('click', (event) => {
  const button = event.target.closest('[data-direction]');
  if (button && !button.disabled) makeMove(button.dataset.direction);
});

gameBoard.addEventListener('click', (event) => {
  const cell = event.target.closest('.legal-cell');
  if (!cell || !currentGame) return;
  const seat = seatForCurrentPlayer(currentGame);
  const position = currentGame.players[seat].position;
  const rowDelta = Number(cell.dataset.row) - position[0];
  const columnDelta = Number(cell.dataset.column) - position[1];
  const direction = rowDelta === -1 ? 'up' : rowDelta === 1 ? 'down' : columnDelta === -1 ? 'left' : 'right';
  makeMove(direction);
});

document.querySelector('#attack-button').addEventListener('click', async () => {
  if (!currentGame) return;
  try {
    renderGame(await api(`/games/${currentGame.id}/attack`, { method: 'POST', body: '{}' }));
    stopPolling();
  } catch (error) {
    showToast(error.message);
  }
});

async function copyGameCode() {
  if (!currentGame) return;
  try {
    await navigator.clipboard.writeText(currentGame.id);
    showToast(`Field code ${currentGame.id} copied.`);
  } catch {
    showToast(`Share field code: ${currentGame.id}`);
  }
}

document.querySelector('#copy-code').addEventListener('click', copyGameCode);
document.querySelector('#share-code').addEventListener('click', copyGameCode);
document.querySelector('#back-to-lobby').addEventListener('click', () => showLobby());
document.querySelector('#logout-button').addEventListener('click', () => {
  stopPolling();
  token = '';
  currentPlayer = null;
  localStorage.removeItem('outpost-token');
  commandCenter.hidden = true;
  authScreen.hidden = false;
  setAuthMode('login');
});

document.addEventListener('keydown', (event) => {
  if (!currentGame?.isYourTurn || !document.querySelector('#move-card').hidden || event.target.matches('input')) return;
  const keyDirection = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' }[event.key];
  if (keyDirection && currentGame.legalMoves.includes(keyDirection)) makeMove(keyDirection);
});

async function restoreSession() {
  if (!token) return;
  try {
    const result = await api('/me');
    currentPlayer = result.player;
    showCommandCenter();
  } catch {
    token = '';
    localStorage.removeItem('outpost-token');
  }
}

restoreSession();