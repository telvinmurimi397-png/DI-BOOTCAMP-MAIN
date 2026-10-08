(function () {
  function getSummary() {
    const state = window.LQScoring.getState();
    return {
      xp: state.xp,
      level: window.LQScoring.getLevel(),
      lessons: state.lessonsCompleted.length,
      words: state.wordsLearned.length,
      games: state.gamesPlayed,
      accuracy: state.totalAnswers ? Math.round((state.correct / state.totalAnswers) * 100) : 0,
      levelProgress: state.xp % 100
    };
  }

  window.LQProgress = { getSummary };
})();
