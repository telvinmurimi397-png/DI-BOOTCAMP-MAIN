(function () {
  function getSnapshot() {
    const state = window.LQScoring.getState();
    const progress = window.LQProgress.getSummary();
    return {
      state,
      progress,
      nextLesson: window.LQLessons.all.find((lesson) => !state.lessonsCompleted.includes(lesson.id)) || window.LQLessons.all[0],
      week: window.LQStreak.getWeek(),
      recentAchievements: window.LQAchievements.getAll().filter((item) => item.unlocked).slice(-3)
    };
  }

  window.LQDashboard = { getSnapshot };
})();
