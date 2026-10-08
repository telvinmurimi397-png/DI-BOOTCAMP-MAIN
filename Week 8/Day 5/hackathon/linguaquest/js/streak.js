(function () {
  function dayKey(date) {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }

  function recordDailyActivity() {
    const state = window.LQScoring.getState();
    const today = dayKey(new Date());
    const yesterday = dayKey(new Date(Date.now() - 86400000));
    if (state.lastActivity === today) return false;
    state.streak = state.lastActivity === yesterday ? state.streak + 1 : 1;
    state.lastActivity = today;
    state.lives = 5;
    state.activityDates = [...new Set([...(state.activityDates || []), today])].slice(-90);
    window.LQScoring.save();
    return true;
  }

  function getWeek() {
    const state = window.LQScoring.getState();
    const today = new Date();
    const start = new Date(today);
    const mondayOffset = (today.getDay() + 6) % 7;
    start.setDate(today.getDate() - mondayOffset);
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const local = dayKey(date);
      return { label: date.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 2), complete: (state.activityDates || []).includes(local), today: local === dayKey(today) };
    });
  }

  window.LQStreak = { recordDailyActivity, getWeek, todayKey: () => dayKey(new Date()) };
})();
