const loading = document.querySelector('#loading');
const errorView = document.querySelector('#errorView');
const errorMessage = document.querySelector('#errorMessage');
const quizView = document.querySelector('#quizView');
const finishView = document.querySelector('#finishView');
const scoreLabel = document.querySelector('#score');
const questionNumber = document.querySelector('#questionNumber');
const questionTotal = document.querySelector('#questionTotal');
const indexNumber = document.querySelector('#indexNumber');
const questionText = document.querySelector('#questionText');
const optionsList = document.querySelector('#options');
const feedback = document.querySelector('#feedback');
const submitButton = document.querySelector('#submitButton');
const nextButton = document.querySelector('#nextButton');
const progressTrack = document.querySelector('.progress-track');
const progressFill = document.querySelector('#progressFill');
const finalScore = document.querySelector('#finalScore');
const finalTotal = document.querySelector('#finalTotal');
const finishMessage = document.querySelector('#finishMessage');

let questions = [];
let currentIndex = 0;
let selectedOptionId = null;
let score = 0;
let answered = false;

async function fetchQuestions() {
  loading.hidden = false;
  errorView.hidden = true;
  quizView.hidden = true;
  finishView.hidden = true;

  try {
    const response = await fetch('/api/questions');
    if (!response.ok) throw new Error('The questions could not be loaded.');
    questions = await response.json();
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error('No questions are available yet. Run the database seed command.');
    }
    loading.hidden = true;
    beginQuiz();
  } catch (error) {
    loading.hidden = true;
    errorMessage.textContent = error.message;
    errorView.hidden = false;
  }
}

function beginQuiz() {
  currentIndex = 0;
  score = 0;
  scoreLabel.textContent = '0';
  finalTotal.textContent = String(questions.length);
  errorView.hidden = true;
  finishView.hidden = true;
  quizView.hidden = false;
  renderQuestion();
}

function renderQuestion() {
  const question = questions[currentIndex];
  selectedOptionId = null;
  answered = false;
  questionNumber.textContent = String(currentIndex + 1).padStart(2, '0');
  indexNumber.textContent = String(currentIndex + 1).padStart(2, '0');
  questionTotal.textContent = String(questions.length).padStart(2, '0');
  questionText.textContent = question.question;
  progressTrack.setAttribute('aria-valuemax', String(questions.length));
  progressTrack.setAttribute('aria-valuenow', String(currentIndex));
  progressFill.style.width = `${(currentIndex / questions.length) * 100}%`;
  feedback.textContent = '';
  feedback.className = 'feedback';
  submitButton.disabled = true;
  submitButton.hidden = false;
  nextButton.hidden = true;
  nextButton.textContent = currentIndex === questions.length - 1 ? 'See your score' : 'Next question';
  optionsList.replaceChildren();

  question.options.forEach((option, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'answer-option';
    button.setAttribute('aria-pressed', 'false');
    button.dataset.optionId = String(option.id);

    const letter = document.createElement('span');
    letter.className = 'option-letter';
    letter.setAttribute('aria-hidden', 'true');
    letter.textContent = String.fromCharCode(65 + index);

    const label = document.createElement('span');
    label.className = 'option-text';
    label.textContent = option.option;

    button.append(letter, label);
    button.addEventListener('click', () => selectOption(button, option.id));
    optionsList.append(button);
  });
}

function selectOption(button, optionId) {
  if (answered) return;
  selectedOptionId = optionId;
  for (const option of optionsList.children) {
    option.setAttribute('aria-pressed', String(option === button));
  }
  submitButton.disabled = false;
}

async function submitAnswer() {
  if (selectedOptionId === null || answered) return;
  submitButton.disabled = true;

  try {
    const response = await fetch('/api/answers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questionId: questions[currentIndex].id,
        optionId: selectedOptionId,
      }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Your answer could not be checked.');

    answered = true;
    if (result.correct) {
      score += 1;
      scoreLabel.textContent = String(score);
      feedback.textContent = 'That is right. Nice one.';
      feedback.classList.add('is-correct');
    } else {
      feedback.textContent = `Not quite. The answer is ${result.correctAnswer}.`;
      feedback.classList.add('is-wrong');
    }

    for (const option of optionsList.children) {
      const isSelected = Number(option.dataset.optionId) === selectedOptionId;
      const isCorrect = option.querySelector('.option-text').textContent === result.correctAnswer;
      option.disabled = true;
      if (isCorrect) option.classList.add('is-correct');
      else if (isSelected) option.classList.add('is-wrong');
    }

    progressTrack.setAttribute('aria-valuenow', String(currentIndex + 1));
    progressFill.style.width = `${((currentIndex + 1) / questions.length) * 100}%`;
    submitButton.hidden = true;
    nextButton.hidden = false;
  } catch (error) {
    feedback.textContent = error.message;
    feedback.classList.add('is-wrong');
    submitButton.disabled = false;
  }
}

function showResults() {
  quizView.hidden = true;
  finishView.hidden = false;
  finalScore.textContent = String(score);
  finalTotal.textContent = String(questions.length);
  finishMessage.textContent = score === questions.length
    ? 'Perfect score. Brilliant.'
    : score >= Math.ceil(questions.length / 2)
      ? 'Nicely done.'
      : 'Good warm-up.';
}

submitButton.addEventListener('click', submitAnswer);
nextButton.addEventListener('click', () => {
  currentIndex += 1;
  if (currentIndex === questions.length) showResults();
  else renderQuestion();
});
document.querySelector('#restartButton').addEventListener('click', beginQuiz);
document.querySelector('#retryButton').addEventListener('click', fetchQuestions);

fetchQuestions();