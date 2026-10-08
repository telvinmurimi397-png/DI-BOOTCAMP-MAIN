(function () {
  function getUsers() {
    try {
      return JSON.parse(localStorage.getItem('linguaquest-users') || '[]');
    } catch (error) {
      console.error('Unable to read registered LinguaQuest accounts.', error);
      return [];
    }
  }

  function saveUsers(users) {
    localStorage.setItem('linguaquest-users', JSON.stringify(users));
  }

  function register(name, email, password) {
    const users = getUsers();
    const normalizedEmail = email.trim().toLowerCase();
    if (!name.trim() || !normalizedEmail || password.length < 6) {
      return { error: 'Enter your name and email, and use a password of at least 6 characters.' };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return { error: 'Enter a valid email address.' };
    }
    if (users.some((user) => user.email === normalizedEmail)) return { error: 'An account with this email already exists.' };
    const user = { name: name.trim(), email: normalizedEmail };
    users.push({ ...user, password });
    saveUsers(users);
    window.LQScoring.setUser(user);
    return { user };
  }

  function login(email, password) {
    const normalizedEmail = email.trim().toLowerCase();
    const account = getUsers().find((user) => user.email === normalizedEmail && user.password === password);
    if (!account) return { error: 'We couldn’t find an account with those details.' };
    const user = { name: account.name, email: account.email };
    window.LQScoring.setUser(user);
    return { user };
  }

  function logout() {
    window.LQScoring.setUser(null);
  }

  window.LQAuth = { register, login, logout };
})();
