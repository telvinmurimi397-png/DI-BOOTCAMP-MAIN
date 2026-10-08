(function () {
  const samples = [
    { name: 'Sofia M.', xp: 1260, streak: 18 },
    { name: 'Leo K.', xp: 980, streak: 12 },
    { name: 'Amara J.', xp: 760, streak: 9 },
    { name: 'Noah R.', xp: 545, streak: 6 },
    { name: 'Mia T.', xp: 410, streak: 4 },
    { name: 'Ethan W.', xp: 250, streak: 3 }
  ];

  function getRows(period) {
    const state = window.LQScoring.getState();
    const values = samples.map((entry) => ({ ...entry }));
    if (state.user) values.push({ name: `${state.user.name} (you)`, xp: state.xp, streak: state.streak, me: true });
    const factor = period === 'Daily' ? 0.08 : period === 'Weekly' ? 0.35 : period === 'Monthly' ? 0.72 : 1;
    return values.map((entry) => ({ ...entry, score: Math.round(entry.xp * factor) })).sort((a, b) => b.score - a.score);
  }

  window.LQLeaderboard = { getRows };
})();
