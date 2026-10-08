(function () {
  const all = [
    { id: 'first-lesson', icon: 'LESSON', title: 'First Lesson', description: 'Complete your first lesson.', test: (s) => s.lessonsCompleted.length >= 1 },
    { id: 'xp-100', icon: '100 XP', title: 'Century Club', description: 'Earn 100 XP.', test: (s) => s.xp >= 100 },
    { id: 'streak-7', icon: '7 DAYS', title: 'On Fire', description: 'Build a 7-day streak.', test: (s) => s.streak >= 7 },
    { id: 'correct-50', icon: '50 OK', title: 'Sharp Shooter', description: 'Get 50 answers correct.', test: (s) => s.correct >= 50 },
    { id: 'level-complete', icon: 'LEVEL', title: 'Level Up', description: 'Earn enough XP to reach level 2.', test: (s) => window.LQScoring.getLevel() >= 2 }
  ];

  function sync() {
    const state = window.LQScoring.getState();
    const unlocked = [];
    all.forEach((achievement) => {
      if (achievement.test(state) && !state.achievements.includes(achievement.id)) {
        state.achievements.push(achievement.id);
        unlocked.push(achievement);
      }
    });
    if (unlocked.length) window.LQScoring.save();
    return unlocked;
  }

  function getAll() {
    const state = window.LQScoring.getState();
    return all.map((item) => ({ ...item, unlocked: state.achievements.includes(item.id) }));
  }

  window.LQAchievements = { sync, getAll };
})();
