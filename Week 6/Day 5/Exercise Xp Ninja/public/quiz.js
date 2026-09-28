const intro = document.querySelector('#intro');
const game = document.querySelector('#game');
const results = document.querySelector('#results');
const startButton = document.querySelector('#start-button');
const restartButton = document.querySelector('#restart-button');
const answerForm = document.querySelector('#answer-form');
const choices = document.querySelector('#choices');
const questionTitle = document.querySelector('#question');
const questionCount = document.querySelector('#question-count');
const scoreDisplay = document.querySelector('#score');
const progressTrack = document.querySelector('#progress-track');
const progressFill = document.querySelector('#progress-fill');
const submitButton = document.querySelector('#submit-button');
const nextButton = document.querySelector('#next-button');
const feedback = document.querySelector('#feedback');
const resultTitle = document.querySelector('#result-title');
const resultScore = document.querySelector('#result-score');
const resultCopy = document.querySelector('#result-copy');

let currentQuestion;
let score = 0;

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
  return data;
}

function showError(error) {
  feedback.classList.remove('hidden', 'incorrect');
  feedback.innerHTML = `<strong>Could not continue</strong>${error.message}`;
}

function renderQuestion(question) {
  currentQuestion = question;
  score = question.score;
  questionTitle.textContent = question.prompt;
  questionCount.textContent = `Question ${question.index + 1} / ${question.total}`;
  scoreDisplay.innerHTML = `${score} <small>POINTS</small>`;
  progressTrack.setAttribute('aria-valuemax', question.total);
  progressTrack.setAttribute('aria-valuenow', question.index);
  progressFill.style.width = `${(question.index / question.total) * 100}%`;
  choices.replaceChildren(choices.querySelector('legend'));
  feedback.classList.add('hidden');
  feedback.classList.remove('incorrect');
  submitButton.classList.remove('hidden');
  nextButton.classList.add('hidden');
  submitButton.disabled = true;

  question.choices.forEach((text, index) => {
    const label = document.createElement('label');
    label.className = 'choice';
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'answer';
    input.value = String(index);
    input.addEventListener('change', () => { submitButton.disabled = false; });
    const choiceText = document.createElement('span');
    choiceText.className = 'choice-text';
    choiceText.textContent = text;
    label.append(input, choiceText);
    choices.append(label);
  });

  progressFill.style.width = `${((question.index + 1) / question.total) * 100}%`;
  progressTrack.setAttribute('aria-valuenow', question.index + 1);
}

function finishQuiz() {
  game.classList.add('hidden');
  results.classList.remove('hidden');
  resultTitle.textContent = score === currentQuestion.total ? 'A perfect round.' : 'Nicely done.';
  resultScore.textContent = `${score} / ${currentQuestion.total}`;
  const percentage = score / currentQuestion.total;
  resultCopy.textContent = percentage === 1
    ? 'Every answer was right. You know your way around the web.'
    : percentage >= 0.5
      ? 'A solid showing. Keep that curiosity switched on.'
      : 'Good first round. A little practice makes a big difference.';
  restartButton.focus();
}

async function startQuiz() {
  startButton.disabled = true;
  try {
    const question = await request('/api/quiz/start', { method: 'POST', body: '{}' });
    intro.classList.add('hidden');
    results.classList.add('hidden');
    game.classList.remove('hidden');
    renderQuestion(question);
    document.querySelector('#choices input')?.focus();
  } catch (error) {
    startButton.disabled = false;
    alert(error.message);
  }
}

startButton.addEventListener('click', startQuiz);
restartButton.addEventListener('click', startQuiz);

answerForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const selected = answerForm.querySelector('input[name="answer"]:checked');
  if (!selected) return;
  submitButton.disabled = true;

  try {
    const result = await request('/api/quiz/answer', {
      method: 'POST',
      body: JSON.stringify({ answer: Number(selected.value) })
    });
    score = result.score;
    scoreDisplay.innerHTML = `${score} <small>POINTS</small>`;
    choices.querySelectorAll('input').forEach((input, index) => {
      input.disabled = true;
      input.closest('.choice').classList.add('is-locked');
      if (index === result.correctAnswer) input.closest('.choice').classList.add('is-correct');
      if (index === Number(selected.value) && !result.correct) input.closest('.choice').classList.add('is-wrong');
    });
    feedback.classList.remove('hidden');
    feedback.classList.toggle('incorrect', !result.correct);
    feedback.replaceChildren();
    const heading = document.createElement('strong');
    heading.textContent = result.correct ? 'Correct!' : 'Not quite.';
    feedback.append(heading, document.createTextNode(result.explanation));
    submitButton.classList.add('hidden');

    if (result.isComplete) {
      const finalMessage = document.createElement('p');
      finalMessage.className = 'feedback-total';
      finalMessage.textContent = `Final score: ${score} out of ${currentQuestion.total}`;
      feedback.append(finalMessage);
      nextButton.textContent = 'See your results →';
      nextButton.classList.remove('hidden');
      nextButton.onclick = finishQuiz;
    } else {
      nextButton.textContent = 'Next question →';
      nextButton.classList.remove('hidden');
      nextButton.onclick = async () => {
        nextButton.disabled = true;
        try {
          const question = await request('/api/quiz/next', { method: 'POST', body: '{}' });
          renderQuestion(question);
          document.querySelector('#choices input')?.focus();
        } catch (error) {
          showError(error);
        } finally {
          nextButton.disabled = false;
        }
      };
    }
    nextButton.focus();
  } catch (error) {
    submitButton.disabled = false;
    showError(error);
  }
});