const loginForm = document.getElementById('loginForm');
const authMessage = document.getElementById('authMessage');

loginForm.addEventListener('submit', function (event) {
  event.preventDefault();

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  if (!username || !password) {
    authMessage.textContent = 'Please enter both username and password.';
    authMessage.className = 'auth-message error';
    return;
  }

  if (username === 'admin' && password === 'admin123') {
    authMessage.textContent = 'Login successful! Redirecting...';
    authMessage.className = 'auth-message success';

    setTimeout(() => {
      window.location.href = 'index.html';
    }, 800);
    return;
  }

  authMessage.textContent = 'Invalid username or password.';
  authMessage.className = 'auth-message error';
});
