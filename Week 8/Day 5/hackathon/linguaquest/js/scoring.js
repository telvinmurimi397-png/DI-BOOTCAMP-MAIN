(function () {
  const KEY = 'linguaquest-state';

  function freshState() {
    return {
      user: null,
      setupComplete: false,
      language: 'French',
      level: 'Beginner',
      goal: 10,
      xp: 0,
      lives: 5,
      correct: 0,
      totalAnswers: 0,
      gamesPlayed: 0,
      lessonsCompleted: [],
      wordsLearned: [],
      lessonProgress: {},
      achievements: [],
      streak: 0,
      lastActivity: '',
      activityDates: [],
      lessonActivityDates: [],
      createdAt: new Date().toISOString()
    };
  }

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY));
      return saved && typeof saved === 'object' ? { ...freshState(), ...saved } : freshState();
    } catch (error) {
      console.error('Unable to read saved LinguaQuest progress.', error);
      return freshState();
    }
  }

  let state = load();

  function save() {
    localStorage.setItem(KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent('linguaquest:change', { detail: state }));
  }

  function getState() {
    return state;
  }

  function setUser(user) {
    state.user = user;
    save();
  }

  function updateSetup(language, level, goal) {
    state.language = language;
    state.level = level;
    state.goal = Number(goal) || 10;
    save();
  }

  function addXP(amount) {
    state.xp += amount;
    save();
  }

  function recordGame(correct, total, words) {
    state.gamesPlayed += 1;
    state.correct += correct;
    state.totalAnswers += total;
    if (Array.isArray(words)) {
      state.wordsLearned = [...new Set([...state.wordsLearned, ...words])];
    }
    save();
  }

  function markLessonComplete(id, words) {
    if (!state.lessonsCompleted.includes(id)) state.lessonsCompleted.push(id);
    state.lessonProgress[id] = 100;
    state.wordsLearned = [...new Set([...state.wordsLearned, ...(words || [])])];
    save();
  }

  function setLessonProgress(id, percent) {
    state.lessonProgress[id] = Math.max(state.lessonProgress[id] || 0, Math.min(100, percent));
    save();
  }

  function recordLessonActivity() {
    const today = window.LQStreak.todayKey();
    state.lessonActivityDates = [...new Set([...(state.lessonActivityDates || []), today])].slice(-90);
    save();
  }

  function getLevel() {
    return Math.floor(state.xp / 100) + 1;
  }

  function resetProgress() {
    state = freshState();
    save();
  }

  window.LQScoring = { getState, setUser, updateSetup, addXP, recordGame, markLessonComplete, setLessonProgress, recordLessonActivity, getLevel, resetProgress, save };
})();
