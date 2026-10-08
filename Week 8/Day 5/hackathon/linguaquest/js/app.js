(function () {
  const app = document.getElementById('app');
  let route = 'home';
  let authMode = 'login';
  let selectedLesson = 'greetings';
  let setupLanguage = 'French';
  let setupLevel = 'Beginner';
  let activeGame = null;
  let gameSource = 'games';
  let leaderboardPeriod = 'Weekly';
  let toastTimer;

  const state = () => window.LQScoring.getState();
  const user = () => state().user;
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
  const setRoute = (next) => { route = next; render(); };
  const pct = (value, max) => Math.min(100, Math.round((value / Math.max(1, max)) * 100));
  const getLesson = (id) => window.LQLessons.get(id) || window.LQLessons.all[0];

  const modes = [
    { id: 'matching', icon: 'MATCH', name: 'Word Matching', description: 'Match each word to its meaning.' },
    { id: 'choice', icon: 'QUIZ', name: 'Multiple Choice', description: 'Choose the correct translation.' },
    { id: 'listen', icon: 'AUDIO', name: 'Listen & Choose', description: 'Listen carefully, then pick the word.' },
    { id: 'translate', icon: 'TYPE', name: 'Translate the Word', description: 'Type the translation and earn XP.' },
    { id: 'sentence', icon: 'BUILD', name: 'Sentence Building', description: 'Arrange words to build the translation.' }
  ];
  const nav = [
    ['dashboard', '⌂', 'Dashboard'], ['languages', '◎', 'Languages'],
    ['lessons', '▤', 'Lessons'], ['games', '✧', 'Mini-games'],
    ['achievements', 'A', 'Achievements'], ['progress', '▥', 'Progress'],
    ['leaderboard', 'R', 'Leaderboard']
  ];

  function showToast(message) {
    clearTimeout(toastTimer);
    document.querySelector('.toast')?.remove();
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    toastTimer = setTimeout(() => toast.remove(), 2800);
  }

  function renderHome() {
    app.innerHTML = `
      <div class="landing">
        <header class="landing-nav"><a class="logo" href="#"><span class="logo-mark">L</span><span>LinguaQuest</span></a><div><button class="btn outline" data-action="open-login">Log in</button><button class="btn" data-action="open-register">Get started</button></div></header>
        <main class="landing-main"><section class="landing-copy"><span class="tag">A little practice. A lot of progress.</span><h1>Make every word count.</h1><p>Build a daily language habit with bite-sized lessons, playful games, and a community cheering you on.</p><div class="landing-actions"><button class="btn" data-action="open-register">Start learning — it’s free <span>→</span></button><button class="btn outline" data-action="open-login">I already have an account</button></div><div class="landing-proof"><span>Earn XP as you learn</span><span>Build a daily streak</span></div></section><div class="landing-art"><div class="bubble bubble-one">Bonjour!</div><div class="bubble bubble-two">¡Hola!</div><div class="art-orbit"><div class="art-globe">WORLD</div></div><div class="bubble bubble-three">こんにちは</div><div class="landing-note">Your next adventure starts with one word.</div></div></main>
        <div class="landing-foot"><span>Small steps, real fluency.</span><span>Learn at your pace · Celebrate every win</span></div>
      </div>`;
  }

  function renderAuth() {
    const register = authMode === 'register';
    app.innerHTML = `<div class="auth-screen"><a class="logo auth-logo" href="#" data-action="go-home"><span class="logo-mark">L</span><span>LinguaQuest</span></a><form class="auth-card" id="auth-form" novalidate><span class="tag">${register ? 'Your journey starts here' : 'Welcome back, learner'}</span><h1>${register ? 'Create your account' : 'Log in to LinguaQuest'}</h1><p class="auth-sub">${register ? 'Set up your profile and start earning your first XP.' : 'Pick up right where your learning adventure left off.'}</p>${register ? '<label class="field">Your name<input name="name" autocomplete="name" placeholder="Alex Morgan" required /></label>' : ''}<label class="field">Email address<input name="email" type="email" autocomplete="email" placeholder="you@example.com" required /></label><label class="field">Password<input name="password" type="password" autocomplete="${register ? 'new-password' : 'current-password'}" placeholder="${register ? 'At least 6 characters' : 'Your password'}" required /></label><div id="auth-error" class="auth-error" role="alert"></div><button class="btn auth-submit" type="submit">${register ? 'Create account →' : 'Log in →'}</button><p class="auth-switch">${register ? 'Already learning with us?' : 'New to LinguaQuest?'} <button type="button" data-action="${register ? 'open-login' : 'open-register'}">${register ? 'Log in' : 'Create an account'}</button></p><p class="demo-hint">Demo: create an account with any email and a password of 6+ characters.</p></form></div>`;
  }

  function renderSetup() {
    const levels = [['Beginner', 'Starting from scratch'], ['Intermediate', 'I know a little'], ['Advanced', 'Ready for a challenge']];
    app.innerHTML = `<div class="setup-screen"><a class="logo" href="#"><span class="logo-mark">L</span><span>LinguaQuest</span></a><main class="setup-card"><span class="tag">A great adventure begins with a choice</span><h1>What would you like to learn?</h1><p class="auth-sub">You can change these preferences anytime.</p><h2>Choose a language</h2><div class="language-grid">${window.LQLanguages.all.map((item) => `<button class="language-card ${setupLanguage === item.name ? 'selected' : ''}" data-action="setup-language" data-language="${item.name}"><span class="language-flag">${item.flag}</span><h3>${item.name}</h3><p>${item.description}</p></button>`).join('')}</div><h2 class="setup-heading">Choose your level</h2><div class="level-select">${levels.map(([name, description]) => `<button class="level-option ${setupLevel === name ? 'selected' : ''}" data-action="setup-level" data-level="${name}"><strong>${name}</strong><span>${description}</span></button>`).join('')}</div><div class="goal-select"><label for="daily-goal">Daily goal</label><select id="daily-goal"><option value="5">5 minutes · Casual</option><option value="10" selected>10 minutes · Regular</option><option value="15">15 minutes · Serious</option><option value="20">20 minutes · Intense</option></select></div><button class="btn setup-submit" data-action="finish-setup">Let’s start learning →</button></main></div>`;
  }

  function shell(content, title) {
    const activeNav = ['lesson', 'game-select', 'game'].includes(route) ? 'lessons' : route;
    app.innerHTML = `<div class="app-shell"><aside class="sidebar"><a class="logo" href="#dashboard" data-route="dashboard"><span class="logo-mark">L</span><span class="logo-text">LinguaQuest</span></a><div class="nav-label">Learn</div><nav class="nav-list">${nav.map(([id, icon, label]) => `<a class="nav-link ${activeNav === id ? 'active' : ''}" href="#${id}" data-route="${id}" aria-label="${label}"><span class="nav-icon">${icon}</span><span>${label}</span></a>`).join('')}</nav><div class="sidebar-bottom"><div class="nav-label">Account</div><a class="nav-link ${route === 'profile' ? 'active' : ''}" href="#profile" data-route="profile"><span class="nav-icon">P</span><span>My profile</span></a><button class="nav-link" type="button" data-action="logout"><span class="nav-icon">OUT</span><span>Log out</span></button><div class="user-chip"><div class="avatar">${escapeHtml(user().name.slice(0, 1).toUpperCase())}</div><div class="user-details"><div class="user-name">${escapeHtml(user().name)}</div><div class="user-level">Level ${window.LQScoring.getLevel()} learner</div></div></div></div></aside><main class="main"><header class="topbar"><h1 class="page-title">${title}</h1><div class="topbar-right"><span class="top-pill">Lives: ${state().lives}</span><span class="top-pill">XP: ${state().xp}</span></div></header><section class="content">${content}</section></main></div>`;
  }

  function renderDashboard() {
    const s = state();
    const p = window.LQProgress.getSummary();
    const next = window.LQLessons.all.find((item) => !s.lessonsCompleted.includes(item.id)) || window.LQLessons.all[0];
    const week = window.LQStreak.getWeek();
    const done = (s.lessonActivityDates || []).includes(window.LQStreak.todayKey());
    const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening';
    const badges = window.LQAchievements.getAll().filter((item) => item.unlocked).slice(-3);
    return `<div class="welcome"><div class="welcome-copy"><p class="welcome-kicker">${greeting}, ${escapeHtml(s.user.name.split(' ')[0])}</p><h2>Ready for a little progress?</h2><p>Your ${escapeHtml(s.language)} adventure is waiting. A few minutes today can take you a long way.</p><button class="btn" data-action="continue-learning">Continue learning →</button></div><div class="mascot" aria-hidden="true">LQ</div></div><div class="stats-grid"><div class="stat-card"><span class="stat-icon">XP</span><div><div class="stat-label">Total XP</div><div class="stat-value">${s.xp}</div></div></div><div class="stat-card"><span class="stat-icon">LV</span><div><div class="stat-label">Current level</div><div class="stat-value">Level ${p.level}</div></div></div><div class="stat-card"><span class="stat-icon">HP</span><div><div class="stat-label">Lives left</div><div class="stat-value">${s.lives} / 5</div></div></div><div class="stat-card"><span class="stat-icon">DAY</span><div><div class="stat-label">Daily streak</div><div class="stat-value">${s.streak} ${s.streak === 1 ? 'day' : 'days'}</div></div></div></div><div><div class="section-heading"><div><h2>Pick up where you left off</h2><p>A little practice goes a long way.</p></div><a class="text-link" href="#lessons" data-route="lessons">All lessons →</a></div><article class="card continue-card"><div class="lesson-emoji">${next.icon}</div><div><h3 class="lesson-title">${next.title}</h3><p class="lesson-description">${next.description}</p><div class="progress-track"><div class="progress-fill" style="width:${s.lessonProgress[next.id] || 0}%"></div></div><div class="lesson-percent">${s.lessonProgress[next.id] || 0}% complete · ${next.minutes} min</div></div><button class="btn" data-action="open-lesson" data-lesson="${next.id}">Continue →</button></article></div><div class="dashboard-grid"><section class="card card-pad"><div class="section-heading"><div><h2>Your week</h2><p>Show up for yourself, one day at a time.</p></div><span class="tag">${s.streak} day streak</span></div><div class="week-row">${week.map((day) => `<div class="day-item"><span class="day-dot ${day.complete ? 'complete' : ''} ${day.today ? 'today' : ''}">${day.complete ? '✓' : '·'}</span><span>${day.label}</span></div>`).join('')}</div><div class="goal-box"><div class="goal-top"><span>Today's learning goal</span><span>${done ? 'Complete!' : `0 / ${s.goal} min`}</span></div><div class="progress-track"><div class="progress-fill" style="width:${done ? 100 : 0}%"></div></div></div></section><section class="card card-pad"><div class="section-heading"><div><h2>Achievements</h2><p>Celebrate the milestones.</p></div><a class="text-link" href="#achievements" data-route="achievements">See all →</a></div>${badges.length ? badges.map((item) => `<div class="achievement-row"><span class="achievement-icon">${item.icon}</span><div><div class="achievement-name">${item.title}</div><div class="achievement-desc">${item.description}</div></div></div>`).join('') : '<p class="lesson-description">Your first badge is just one lesson away.</p>'}</section></div>`;
  }

  function renderLanguages() {
    const levels = [['Beginner', 'Starting from scratch'], ['Intermediate', 'I know a little'], ['Advanced', 'Ready for a challenge']];
    return `<div class="section-heading"><div><h2>Your next language</h2><p>Pick a language and choose a level that feels right for you.</p></div></div><div class="language-grid">${window.LQLanguages.all.map((item) => `<button class="language-card ${state().language === item.name ? 'selected' : ''}" data-action="choose-language" data-language="${item.name}"><span class="language-flag">${item.code}</span><h3>${item.name}</h3><p>${item.description}</p>${state().language === item.name ? '<span class="tag language-selected">Currently learning</span>' : ''}</button>`).join('')}</div><section class="card card-pad"><div class="section-heading"><div><h2>Set your level</h2><p>Lessons adapt to your learning goals.</p></div></div><div class="level-select">${levels.map(([name, description]) => `<button class="level-option ${state().level === name ? 'selected' : ''}" data-action="choose-level" data-level="${name}"><strong>${name}</strong><span>${description}</span></button>`).join('')}</div></section>`;
  }

  function renderLessons() {
    return `<div class="section-heading"><div><h2>Learn something new</h2><p>Choose a short lesson, then practise with a game.</p></div></div><div class="lesson-grid">${window.LQLessons.all.map((item) => `<article class="lesson-card" role="button" tabindex="0" data-action="open-lesson" data-lesson="${item.id}"><div class="lesson-emoji">${item.icon}</div><div class="lesson-meta"><span class="tag">${item.category}</span><span>${item.minutes} min</span></div><h3>${item.title}</h3><p>${item.description}</p><div class="progress-track lesson-progress"><div class="progress-fill" style="width:${state().lessonProgress[item.id] || 0}%"></div></div></article>`).join('')}</div>`;
  }

  function renderLesson() {
    const item = getLesson(selectedLesson);
    const words = window.LQGames.getQuestions(item.id, state().language);
    return `<section class="card card-pad"><div class="lesson-detail-head"><div class="lesson-emoji">${item.icon}</div><div><span class="tag">${item.category} · ${item.minutes} min</span><h2>${item.title}</h2><p>${item.description}</p></div></div><div class="section-heading"><div><h2>Today's vocabulary</h2><p>Listen to each word and say it out loud.</p></div><button class="btn outline small" data-action="speak-all">Listen to all</button></div><div class="vocabulary-list">${words.map((pair) => `<div class="vocab-row"><div><strong>${escapeHtml(pair.word)}</strong><span>${escapeHtml(pair.meaning)}</span></div><button class="audio-btn" aria-label="Hear word" data-action="speak" data-word="${escapeHtml(pair.word)}">Play</button></div>`).join('')}</div><div class="lesson-actions"><button class="btn outline" data-route="lessons">← All lessons</button><button class="btn" data-action="start-lesson-game">Practice with a game →</button></div></section>`;
  }

  function renderGames() {
    const item = getLesson(selectedLesson);
    return `<div class="section-heading"><div><h2>Choose your mini-game</h2><p>Practise ${item.title.toLowerCase()} in ${escapeHtml(state().language)}.</p></div><button class="btn outline small" data-route="lessons">Change lesson</button></div><div class="game-grid">${modes.map((mode) => `<button class="game-card" data-action="start-game" data-mode="${mode.id}"><span class="game-emoji">${mode.icon}</span><h3>${mode.name}</h3><p>${mode.description}</p><span class="tag">+ XP</span></button>`).join('')}</div>`;
  }

  function modeInfo(mode) { return modes.find((item) => item.id === mode) || modes[1]; }

  function renderGame() {
    const game = activeGame;
    if (!game) return '<div class="empty-state">Choose a game to begin.</div>';
    const question = game.questions[game.index];
    if (game.mode === 'matching') return renderMatching();
    const prompt = game.mode === 'listen'
      ? `<div class="audio-prompt"><button class="listen-button" data-action="speak" data-word="${escapeHtml(question.word)}">Play audio<span>Tap to listen</span></button></div><p class="prompt-label">What does this word mean?</p>`
      : `<p class="prompt-label">${game.mode === 'sentence' ? 'Build the meaning of this word:' : game.mode === 'translate' ? 'Translate this word into English:' : 'Choose the correct meaning:'}</p><h2>${escapeHtml(question.word)}</h2>`;
    let answers;
    if (game.mode === 'translate') {
      answers = `<form class="translate-form" data-form="translate"><input name="translation" autocomplete="off" placeholder="Type the meaning…" ${game.answered ? 'disabled' : ''} /><button class="btn" ${game.answered ? 'disabled' : ''}>Check answer</button></form>`;
    } else if (game.mode === 'sentence') {
      const target = question.sentence || question.meaning.replace(/[?!…]/g, '');
      game.sentenceWords ||= window.LQGames.shuffle(target.split(/\s+/));
      game.sentenceAnswer ||= [];
      game.sentenceUsed ||= [];
      answers = `<div class="sentence-answer">${game.sentenceAnswer.length ? game.sentenceAnswer.map((word, index) => `<button class="sentence-word" data-action="remove-sentence-word" data-index="${index}">${escapeHtml(word)}</button>`).join('') : '<span class="muted">Tap the words below to build the translation</span>'}</div><div class="sentence-bank">${game.sentenceWords.map((word, index) => `<button class="sentence-word ${game.sentenceUsed.includes(index) ? 'used' : ''}" data-action="add-sentence-word" data-index="${index}" ${game.answered || game.sentenceUsed.includes(index) ? 'disabled' : ''}>${escapeHtml(word)}</button>`).join('')}</div><button class="btn" data-action="check-sentence" ${game.answered ? 'disabled' : ''}>Check sentence</button>`;
    } else {
      const options = game.mode === 'listen' ? window.LQGames.shuffle(game.questions.map((item) => item.word)) : window.LQGames.shuffle(question.options);
      answers = `<div class="game-options">${options.map((option) => {
        const value = game.mode === 'listen' ? game.questions.find((item) => item.word === option).meaning : option;
        return `<button class="answer-option ${game.selectedAnswer === option ? (game.lastCorrect ? 'correct' : 'wrong') : ''}" data-action="answer" data-answer="${escapeHtml(value)}" data-choice="${escapeHtml(option)}" ${game.answered ? 'disabled' : ''}>${escapeHtml(option)}</button>`;
      }).join('')}</div>`;
    }
    return `<section class="card game-panel"><div class="game-progress"><span>${modeInfo(game.mode).icon} ${modeInfo(game.mode).name}</span><span>Question ${game.index + 1} of ${game.questions.length}</span></div><div class="progress-track game-track"><div class="progress-fill" style="width:${pct(game.index, game.questions.length)}%"></div></div><div class="game-prompt">${prompt}</div>${answers}<div class="game-footer"><div class="feedback ${game.answered ? (game.lastCorrect ? 'good' : 'bad') : ''}">${game.answered ? (game.lastCorrect ? 'That’s right! Nice work.' : `Not quite — the answer is “${escapeHtml(question.meaning)}”.`) : ''}</div>${game.answered ? `<button class="btn" data-action="next-question">${game.index === game.questions.length - 1 ? 'See results →' : 'Next →'}</button>` : ''}</div></section><button class="btn outline small back-game" data-action="exit-game">← Exit game</button>`;
  }

  function renderMatching() {
    const game = activeGame;
    const meanings = game.matchMeanings || (game.matchMeanings = window.LQGames.shuffle(game.questions.map((item) => item.meaning)));
    const all = [...game.questions.map((item) => ({ value: item.word, side: 'word' })), ...meanings.map((value) => ({ value, side: 'meaning' }))];
    return `<section class="card game-panel"><div class="game-progress"><span>Word Matching</span><span>${game.matched.length / 2} / ${game.questions.length} matched</span></div><div class="progress-track game-track"><div class="progress-fill" style="width:${pct(game.matched.length, game.questions.length * 2)}%"></div></div><div class="game-prompt"><p class="prompt-label">Find the matching pairs</p><h2>Word to meaning</h2></div><div class="word-match">${all.map((item) => `<button class="match-word ${game.matched.includes(item.value) ? 'matched' : ''} ${game.selectedPair === `${item.side}:${item.value}` ? 'selected' : ''}" data-action="select-match" data-value="${escapeHtml(item.value)}" data-side="${item.side}" ${game.matched.includes(item.value) || game.answered ? 'disabled' : ''}>${escapeHtml(item.value)}</button>`).join('')}</div><div class="game-footer"><div class="feedback ${game.matchFeedback?.good ? 'good' : game.matchFeedback ? 'bad' : ''}">${game.matchFeedback?.text || ''}</div>${game.matched.length === game.questions.length * 2 ? '<button class="btn" data-action="finish-match">See results →</button>' : ''}</div></section><button class="btn outline small back-game" data-action="exit-game">← Exit game</button>`;
  }

  function renderResult() {
    const game = activeGame;
    const unlocked = window.LQAchievements.sync();
    return `<section class="card game-panel result"><div class="result-emoji">${game.correct === game.questions.length ? 'LEVEL UP' : game.correct >= game.questions.length / 2 ? 'WELL DONE' : 'KEEP GOING'}</div><span class="tag">${modeInfo(game.mode).name} complete</span><h2>${game.correct === game.questions.length ? 'Perfect round!' : 'Nice practice!'}</h2><p>You got ${game.correct} of ${game.questions.length} correct. Every round makes you stronger.</p><div class="result-score">+${game.correct * 10} XP</div>${unlocked.map((item) => `<p class="new-badge">Achievement unlocked: <strong>${item.title}</strong></p>`).join('')}<div class="result-actions"><button class="btn outline" data-action="exit-game">Choose another game</button><button class="btn" data-action="finish-lesson">Back to dashboard →</button></div></section>`;
  }

  function renderAchievements() {
    const all = window.LQAchievements.getAll();
    return `<div class="section-heading"><div><h2>Every milestone matters</h2><p>Keep learning to unlock these badges.</p></div><span class="tag">${state().achievements.length} / ${all.length} unlocked</span></div><div class="achievement-grid">${all.map((item) => `<article class="achievement-card ${item.unlocked ? '' : 'locked'}"><div class="achievement-icon">${item.icon}</div><h3>${item.title} ${item.unlocked ? '✓' : 'Locked'}</h3><p>${item.description}</p></article>`).join('')}</div>`;
  }

  function renderProgress() {
    const p = window.LQProgress.getSummary();
    return `<div class="section-heading"><div><h2>Your learning at a glance</h2><p>Progress adds up, one practice session at a time.</p></div></div><div class="progress-layout"><article class="card progress-metric"><h3>Level progress</h3><div class="metric-big">Level ${p.level}</div><p class="metric-caption">${p.levelProgress} / 100 XP to the next level</p><div class="progress-track progress-space"><div class="progress-fill" style="width:${p.levelProgress}%"></div></div></article><article class="card progress-metric"><h3>Accuracy</h3><div class="metric-big">${p.accuracy}%</div><p class="metric-caption">${state().correct} correct answers so far</p><div class="progress-track progress-space"><div class="progress-fill" style="width:${p.accuracy}%"></div></div></article><article class="card progress-metric"><h3>Words learned</h3><div class="metric-big">${p.words}</div><p class="metric-caption">Unique words practised in games</p></article><article class="card progress-metric"><h3>Lessons completed</h3><div class="metric-big">${p.lessons}</div><p class="metric-caption">Out of ${window.LQLessons.all.length} ${escapeHtml(state().language)} lessons</p></article><article class="card progress-metric"><h3>Games played</h3><div class="metric-big">${p.games}</div><p class="metric-caption">Keep going to build your skills</p></article><article class="card progress-metric"><h3>XP earned</h3><div class="metric-big">${p.xp} XP</div><p class="metric-caption">Earn ${100 - p.levelProgress} XP to reach the next level</p></article></div>`;
  }

  function renderLeaderboard() {
    const rows = window.LQLeaderboard.getRows(leaderboardPeriod);
    return `<div class="section-heading"><div><h2>A little friendly motivation</h2><p>Cheer on fellow learners and climb the rankings.</p></div><select class="period-select" id="leaderboard-period" aria-label="Leaderboard period">${['Daily', 'Weekly', 'Monthly', 'Overall'].map((period) => `<option ${period === leaderboardPeriod ? 'selected' : ''}>${period}</option>`).join('')}</select></div><div class="card leaderboard">${rows.map((item, index) => `<div class="leader-row ${item.me ? 'me' : ''}"><div class="rank ${index < 3 ? 'gold' : ''}">#${index + 1}</div><div class="leader-user"><span class="avatar">${escapeHtml(item.name.slice(0, 1))}</span>${escapeHtml(item.name)}</div><div class="leader-xp">${item.score.toLocaleString()} XP</div><div class="leader-streak">${item.streak} days</div></div>`).join('')}</div><p class="footer-note">Learner rankings are a demo preview; your XP is saved on this device.</p>`;
  }

  function renderProfile() {
    return `<section class="card card-pad"><div class="section-heading"><div><h2>Your learner profile</h2><p>Manage your display name and learning preferences.</p></div><span class="avatar profile-avatar">${escapeHtml(user().name.slice(0, 1).toUpperCase())}</span></div><form id="profile-form"><label class="field">Display name<input name="name" value="${escapeHtml(user().name)}" required /></label><label class="field">Email address<input name="email" value="${escapeHtml(user().email)}" disabled /></label><label class="field">Learning language<select name="language">${window.LQLanguages.all.map((item) => `<option ${state().language === item.name ? 'selected' : ''}>${item.name}</option>`).join('')}</select></label><label class="field">Daily goal<select name="goal">${[5, 10, 15, 20].map((goal) => `<option value="${goal}" ${state().goal === goal ? 'selected' : ''}>${goal} minutes</option>`).join('')}</select></label><button class="btn">Save profile</button><button type="button" class="btn outline reset-progress" data-action="reset-progress">Reset learning progress</button></form></section>`;
  }

  function render() {
    if (route === 'home' || route === 'login' || route === 'register') {
      if (route === 'home') renderHome();
      else { authMode = route; renderAuth(); }
      return;
    }
    if (!user()) { route = 'home'; renderHome(); return; }
    if (!state().setupComplete && route !== 'setup') { route = 'setup'; renderSetup(); return; }
    if (route === 'setup') { renderSetup(); return; }
    const pages = {
      dashboard: ['Your dashboard', renderDashboard],
      languages: ['Choose a language', renderLanguages],
      lessons: ['Your lessons', renderLessons],
      lesson: [getLesson(selectedLesson).title, renderLesson],
      games: ['Choose a game', renderGames],
      'game-select': ['Choose a game', renderGames],
      game: [activeGame?.result ? 'Round complete' : 'Let’s play', () => activeGame?.result ? renderResult() : renderGame()],
      achievements: ['Achievements', renderAchievements],
      progress: ['Your progress', renderProgress],
      leaderboard: ['Leaderboard', renderLeaderboard],
      profile: ['My profile', renderProfile]
    };
    const [title, renderPage] = pages[route] || pages.dashboard;
    shell(renderPage(), title);
  }

  function speak(word) {
    if (!('speechSynthesis' in window)) { showToast('Audio playback is not available in this browser.'); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = ({ French: 'fr-FR', Spanish: 'es-ES', Japanese: 'ja-JP', Italian: 'it-IT', German: 'de-DE', Swahili: 'sw-KE' })[state().language] || 'fr-FR';
    window.speechSynthesis.speak(utterance);
  }

  function startGame(mode) {
    if (route === 'lesson') gameSource = 'lesson';
    activeGame = window.LQGames.create(mode, selectedLesson, state().language);
    setRoute('game');
    if (mode === 'listen') setTimeout(() => speak(activeGame.questions[0].word), 100);
  }

  function answer(value, selected) {
    const result = window.LQGames.check(activeGame, value);
    if (result.locked) return;
    activeGame.lastCorrect = result.correct;
    activeGame.selectedAnswer = selected || value;
    if (!result.correct) { state().lives = Math.max(0, state().lives - 1); window.LQScoring.save(); }
    render();
  }

  function nextQuestion() {
    if (activeGame.index < activeGame.questions.length - 1) {
      activeGame.index += 1;
      activeGame.answered = false;
      activeGame.selectedAnswer = null;
      activeGame.lastCorrect = false;
      activeGame.sentenceWords = null;
      activeGame.sentenceAnswer = [];
      activeGame.sentenceUsed = [];
      render();
      if (activeGame.mode === 'listen') setTimeout(() => speak(activeGame.questions[activeGame.index].word), 100);
      return;
    }
    finishGame();
  }

  function finishGame() {
    const game = activeGame;
    game.result = true;
    const earned = game.correct * 10;
    const words = game.questions.filter((item) => game.wordsFound.includes(item.word)).map((item) => item.word);
    window.LQScoring.recordGame(game.correct, game.questions.length, words);
    window.LQScoring.addXP(earned);
    window.LQStreak.recordDailyActivity();
    window.LQScoring.recordLessonActivity();
    if (game.correct === game.questions.length) window.LQScoring.markLessonComplete(game.lessonId, game.questions.map((item) => item.word));
    else if (game.correct > 0) window.LQScoring.setLessonProgress(game.lessonId, Math.max(30, pct(game.correct, game.questions.length) * 0.6));
    const badges = window.LQAchievements.sync();
    if (earned) showToast(`Great work! You earned ${earned} XP`);
    if (badges.length) setTimeout(() => showToast(`Achievement unlocked: ${badges[0].title}`), 900);
    render();
  }

  function resetGame() {
    activeGame = null;
    setRoute(gameSource === 'lesson' ? 'lesson' : 'games');
  }

  function selectMatch(button) {
    const game = activeGame;
    const value = button.dataset.value;
    const side = button.dataset.side;
    const key = `${side}:${value}`;
    if (!game.selectedPair) { game.selectedPair = key; render(); return; }
    if (game.selectedPair === key) { game.selectedPair = null; render(); return; }
    const [firstSide, ...parts] = game.selectedPair.split(':');
    const firstValue = parts.join(':');
    const word = firstSide === 'word' ? firstValue : value;
    const meaning = firstSide === 'meaning' ? firstValue : value;
    const match = firstSide !== side && game.questions.find((item) => item.word === word && item.meaning === meaning);
    if (match) {
      game.matched.push(word, meaning);
      game.correct += 1;
      game.wordsFound.push(word);
      game.matchFeedback = { good: true, text: 'A perfect match!' };
    } else {
      game.matchFeedback = { good: false, text: 'Not a pair — try another.' };
    }
    game.selectedPair = null;
    render();
  }

  function clickAction(button) {
    const action = button.dataset.action;
    if (action === 'open-login') { authMode = 'login'; setRoute('login'); }
    else if (action === 'open-register') { authMode = 'register'; setRoute('register'); }
    else if (action === 'go-home') setRoute('home');
    else if (action === 'logout') { window.LQAuth.logout(); setRoute('home'); }
    else if (action === 'finish-setup') {
      const goal = document.getElementById('daily-goal')?.value || '10';
      window.LQScoring.updateSetup(setupLanguage, setupLevel, goal);
      state().setupComplete = true;
      window.LQScoring.save();
      window.LQStreak.recordDailyActivity();
      setRoute('dashboard');
      showToast(`Your ${setupLanguage} journey starts now!`);
    } else if (action === 'setup-language') { setupLanguage = button.dataset.language; renderSetup(); }
    else if (action === 'setup-level') { setupLevel = button.dataset.level; renderSetup(); }
    else if (action === 'choose-language') { window.LQScoring.updateSetup(button.dataset.language, state().level, state().goal); showToast(`Learning ${button.dataset.language} — fantastic choice!`); render(); }
    else if (action === 'choose-level') { window.LQScoring.updateSetup(state().language, button.dataset.level, state().goal); render(); }
    else if (action === 'continue-learning') { selectedLesson = window.LQLessons.all.find((item) => !state().lessonsCompleted.includes(item.id))?.id || 'greetings'; setRoute('lesson'); }
    else if (action === 'open-lesson') { selectedLesson = button.dataset.lesson; window.LQScoring.setLessonProgress(selectedLesson, Math.max(10, state().lessonProgress[selectedLesson] || 0)); setRoute('lesson'); }
    else if (action === 'start-lesson-game') { gameSource = 'lesson'; setRoute('game-select'); }
    else if (action === 'start-game') startGame(button.dataset.mode);
    else if (action === 'answer') answer(button.dataset.answer, button.dataset.choice);
    else if (action === 'next-question') nextQuestion();
    else if (action === 'exit-game') resetGame();
    else if (action === 'finish-lesson') { activeGame = null; setRoute('dashboard'); }
    else if (action === 'speak') speak(button.dataset.word);
    else if (action === 'speak-all') speak(window.LQGames.getQuestions(selectedLesson, state().language).map((item) => item.word).join('. '));
    else if (action === 'add-sentence-word') {
      const index = Number(button.dataset.index);
      activeGame.sentenceAnswer.push(activeGame.sentenceWords[index]);
      activeGame.sentenceUsed.push(index);
      render();
    } else if (action === 'remove-sentence-word') {
      const index = Number(button.dataset.index);
      const [removed] = activeGame.sentenceAnswer.splice(index, 1);
      const usedIndex = activeGame.sentenceUsed.find((entry) => activeGame.sentenceWords[entry] === removed);
      if (usedIndex !== undefined) activeGame.sentenceUsed.splice(activeGame.sentenceUsed.indexOf(usedIndex), 1);
      render();
    } else if (action === 'check-sentence') {
      const question = activeGame.questions[activeGame.index];
      const expected = (question.sentence || question.meaning).replace(/[?!…]/g, '').trim().toLowerCase();
      const entered = activeGame.sentenceAnswer.join(' ').trim().toLowerCase();
      const result = window.LQGames.check(activeGame, entered === expected ? question.meaning : entered);
      activeGame.lastCorrect = result.correct;
      if (result.correct) activeGame.wordsFound.push(question.word);
      if (!result.correct) { state().lives = Math.max(0, state().lives - 1); window.LQScoring.save(); }
      render();
    } else if (action === 'select-match') selectMatch(button);
    else if (action === 'finish-match') finishGame();
    else if (action === 'reset-progress' && window.confirm('Reset your XP, streak, and learning progress on this device?')) {
      const savedUser = user();
      window.LQScoring.resetProgress();
      window.LQScoring.setUser(savedUser);
      state().setupComplete = true;
      window.LQScoring.save();
      setRoute('dashboard');
      showToast('Progress reset.');
    }
  }

  app.addEventListener('click', (event) => {
    const routeLink = event.target.closest('[data-route]');
    if (routeLink) { event.preventDefault(); activeGame = null; setRoute(routeLink.dataset.route); return; }
    const button = event.target.closest('[data-action]');
    if (button && !button.disabled) clickAction(button);
  });

  app.addEventListener('submit', (event) => {
    if (event.target.id === 'auth-form') {
      event.preventDefault();
      const data = new FormData(event.target);
      const result = authMode === 'register'
        ? window.LQAuth.register(data.get('name') || '', data.get('email') || '', data.get('password') || '')
        : window.LQAuth.login(data.get('email') || '', data.get('password') || '');
      if (result.error) { document.getElementById('auth-error').textContent = result.error; return; }
      setupLanguage = state().language;
      setupLevel = state().level;
      if (!state().setupComplete) setRoute('setup');
      else { window.LQStreak.recordDailyActivity(); setRoute('dashboard'); }
    } else if (event.target.dataset.form === 'translate') {
      event.preventDefault();
      const value = new FormData(event.target).get('translation')?.toString() || '';
      if (!value.trim()) { showToast('Type a translation before checking.'); return; }
      answer(value);
    } else if (event.target.id === 'profile-form') {
      event.preventDefault();
      const data = new FormData(event.target);
      const name = data.get('name').trim();
      if (!name) { showToast('Your name cannot be blank.'); return; }
      window.LQScoring.setUser({ ...user(), name });
      window.LQScoring.updateSetup(data.get('language'), state().level, data.get('goal'));
      showToast('Profile saved.');
      render();
    }
  });

  app.addEventListener('change', (event) => {
    if (event.target.id === 'leaderboard-period') { leaderboardPeriod = event.target.value; render(); }
  });
  window.addEventListener('hashchange', () => {
    const hash = location.hash.replace('#', '');
    if (nav.some(([id]) => id === hash) || ['profile', 'login', 'register'].includes(hash)) { activeGame = null; setRoute(hash); }
  });
  window.addEventListener('linguaquest:change', () => {
    if (!['game', 'login', 'register', 'setup'].includes(route)) render();
  });
  const initialRoute = location.hash.replace('#', '');
  if (nav.some(([id]) => id === initialRoute) || ['profile', 'login', 'register'].includes(initialRoute)) route = initialRoute;
  if (user()) {
    window.LQStreak.recordDailyActivity();
    if (!initialRoute) route = state().setupComplete ? 'dashboard' : 'setup';
  }
  render();
})();
