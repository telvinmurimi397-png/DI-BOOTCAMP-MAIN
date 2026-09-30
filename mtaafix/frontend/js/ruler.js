document.addEventListener('DOMContentLoaded', function () {
  var token = localStorage.getItem('mtaafix_token');
  var role = localStorage.getItem('mtaafix_role');

  if (!token || role !== 'ruler') {
    window.location.replace(role === 'resident' ? '/frontend/home.html' : '/frontend/login.html?role=ruler');
    return;
  }

  API.getRulerDashboard().then(function (data) {
    renderReports(document.getElementById('ruler-report-list'), data.reports || []);
    document.body.classList.add('ruler-authorized');
  }).catch(function () {
    window.location.replace('/frontend/login.html?role=ruler');
  });

  document.getElementById('logout-btn').addEventListener('click', function () {
    localStorage.removeItem('mtaafix_token');
    localStorage.removeItem('mtaafix_role');
    window.location.replace('/frontend/home.html');
  });
});