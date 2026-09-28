const welcome = document.querySelector('#welcome');
const startForm = document.querySelector('#start-form');
const nameInput = document.querySelector('#player-name');
const gamePanel = document.querySelector('#game');
const results = document.querySelector('#results');
const guessForm = document.querySelector('#guess-form');
const options = document.querySelector('#options');
const emojiDisplay = document.querySelector('#emoji-display');
const roundLabel = document.querySelector('#round-label');
const scoreLabel = document.querySelector('#score-label');
const progress = document.querySelector('#progress');
const progressFill = document.querySelector('#progress-fill');
const guessButton = document.querySelector('#guess-button');
const nextButton = document.querySelector('#next-button');
const feedback = document.querySelector('#feedback');
const leaderboardList = document.querySelector('#leaderboard-list');
const emptyBoard = document.querySelector('#empty-board');
const resultTitle = document.querySelector('#result-title');
const resultScore = document.querySelector('#result-score');
const resultCopy = document.querySelector('#result-copy');
const playAgainButton = document.querySelector('#play-again');

let currentRound;

async function api(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Something went wrong. Try again.');
  return data;
}

function showError(error) {
  feedback.textContent = error.message;
  feedback.classList.remove('hidden', 'wrong');
}

function renderLeaderboard(entries) {
  leaderboardList.replaceChildren();
  emptyBoard.classList.toggle('hidden', entries.length > 0);

  entries.forEach((entry) => {
    const row = document.createElement('li');
    const rank = document.createElement('span');
    rank.className = 'rank';
    rank.textContent = String(entry.rank).padStart(2, '0');
    const name = document.createElement('span');
    name.textContent = entry.name;
    const score = document.createElement('span');
    score.className = 'player-score';
    score.textContent = `${entry.score}/10`;
    row.append(rank, name, score);
    leaderboardList.append(row);
  });
}

function renderRound(round) {
  currentRound = round;
  emojiDisplay.textContent = round.emoji;
  emojiDisplay.setAttribute('aria-label', `Mystery emoji for round ${round.round}`);
  roundLabel.textContent = `ROUND ${String(round.round).padStart(2, '0')} / ${round.total}`;
  scoreLabel.textContent = `${round.score} RIGHT`;
  progress.setAttribute('aria-valuemax', round.total);
  progress.setAttribute('aria-valuenow', round.round - 1);
  progressFill.style.width = `${((round.round - 1) / round.total) * 100}%`;
  feedback.classList.add('hidden');
  guessButton.classList.remove('hidden');
  guessButton.disabled = true;
  nextButton.classList.add('hidden');
  options.replaceChildren(options.querySelector('legend'));

  round.choices.forEach((choice, index) => {
    const label = document.createElement('label');
    label.className = 'option';
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'guess';
    input.value = choice;
    input.setAttribute('aria-label', choice);
    input.addEventListener('change', () => { guessButton.disabled = false; });
    const name = document.createElement('span');
    name.textContent = choice;
    label.append(input, name);
    options.append(label);
  });

  progress.setAttribute('aria-valuenow', round.round);
  progressFill.style.width = `${(round.round / round.total) * 100}%`;
  document.querySelector('#options input')?.focus();
}

function finishGame(score, total) {
  gamePanel.classList.add('hidden');
  results.classList.remove('hidden');
  resultTitle.textContent = score === total ? 'Emoji expert.' : score >= total / 2 ? 'Nicely decoded.' : 'A fun first round.';
  resultScore.textContent = `${score} / ${total}`;
  resultCopy.textContent = `${nameInput.value.trim()}, your score has been added to the leaderboard.`;
  renderLeaderboard(currentRound.leaderboard || []);
  playAgainButton.focus();
}

async function startGame(name) {
  const round = await api('/api/game/start', { method: 'POST', body: JSON.stringify({ name }) });
  nameInput.value = name;
  welcome.classList.add('hidden');
  results.classList.add('hidden');
  gamePanel.classList.remove('hidden');
  renderRound(round);
}

startForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const submit = startForm.querySelector('button[type="submit"]');
  submit.disabled = true;
  try {
    await startGame(nameInput.value.trim());
  } catch (error) {
    alert(error.message);
  } finally {
    submit.disabled = false;
  }
});

guessForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const selected = guessForm.querySelector('input[name="guess"]:checked');
  if (!selected) return;
  guessButton.disabled = true;

  try {
    const result = await api('/api/game/guess', {
      method: 'POST',
      body: JSON.stringify({ guess: selected.value })
    });
    scoreLabel.textContent = `${result.score} RIGHT`;
    feedback.classList.remove('hidden', 'wrong');
    feedback.classList.toggle('wrong', !result.correct);
    feedback.textContent = result.correct ? `Yes! That's a ${result.answer}.` : `Not quite. That's a ${result.answer}.`;
    options.querySelectorAll('input').forEach((input) => {
      input.disabled = true;
      input.closest('.option').classList.add('locked');
      if (input.value === result.answer) input.closest('.option').classList.add('correct');
      if (input.checked && !result.correct) input.closest('.option').classList.add('incorrect');
    });

    if (result.isComplete) {
      currentRound.leaderboard = result.leaderboard;
      nextButton.textContent = 'See your score →';
      nextButton.onclick = () => finishGame(result.score, result.total);
    } else {
      nextButton.textContent = 'Next emoji →';
      nextButton.onclick = async () => {
        nextButton.disabled = true;
        try {
          const round = await api('/api/game/next', { method: 'POST', body: '{}' });
          renderRound(round);
        } catch (error) {
          showError(error);
        } finally {
          nextButton.disabled = false;
        }
      };
    }
    nextButton.classList.remove('hidden');
    nextButton.focus();
  } catch (error) {
    guessButton.disabled = false;
    showError(error);
  }
});

playAgainButton.addEventListener('click', async () => {
  playAgainButton.disabled = true;
  try {
    await startGame(nameInput.value.trim());
  } catch (error) {
    alert(error.message);
  } finally {
    playAgainButton.disabled = false;
  }
});

api('/api/leaderboard').then(renderLeaderboard).catch(showError);