var activeRole = 'resident';

function setRole(role) {
  activeRole = role;
  var residentFields = document.getElementById('resident-fields');
  var rulerFields = document.getElementById('ruler-fields');
  var tabs = document.querySelectorAll('.tab');

  residentFields.classList.toggle('hidden', role !== 'resident');
  rulerFields.classList.toggle('hidden', role !== 'ruler');

  tabs.forEach(function (tab) {
    tab.classList.toggle('active', tab.dataset.role === role);
  });
}

function handleLogin(event) {
  event.preventDefault();
  var phone = document.getElementById('phone').value;
  var username = document.getElementById('username').value;
  var password = document.getElementById('password').value;

  var request;
  if (activeRole === 'resident') {
    request = API.loginResident(phone, password);
  } else {
    request = API.loginRuler(username, password);
  }

  request.then(function (data) {
    localStorage.setItem('mtaafix_token', data.token);
    localStorage.setItem('mtaafix_role', activeRole);
    if (activeRole === 'resident') {
      window.location.href = '/frontend/index.html';
    } else {
      window.location.href = '/frontend/ruler.html';
    }
  }).catch(function (err) {
    alert(err.message || 'Login failed');
  });
}

document.querySelectorAll('.tab').forEach(function (tab) {
  tab.addEventListener('click', function () {
    setRole(tab.dataset.role);
  });
});

document.getElementById('login-form').addEventListener('submit', handleLogin);
setRole('resident');
