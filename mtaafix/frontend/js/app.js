document.addEventListener('DOMContentLoaded', function () {
  var token = localStorage.getItem('mtaafix_token');
  if (!token) {
    window.location.href = '/frontend/login.html';
    return;
  }

  Promise.all([
    API.getAreas(),
    API.getCategories(),
    API.getReports()
  ]).then(function (results) {
    var areas = results[0].areas || [];
    var categories = results[1].categories || [];
    var reports = results[2].reports || [];

    var areaSelect = document.getElementById('area');
    var categorySelect = document.getElementById('category');

    areas.forEach(function (area) {
      var option = document.createElement('option');
      option.value = area;
      option.textContent = area;
      areaSelect.appendChild(option);
    });

    categories.forEach(function (category) {
      var option = document.createElement('option');
      option.value = category;
      option.textContent = category;
      categorySelect.appendChild(option);
    });

    renderReports(document.getElementById('report-list'), reports);
  }).catch(function (err) {
    console.error(err);
    alert(err.message || 'Could not load reports');
  });

  document.getElementById('report-form').addEventListener('submit', function (event) {
    event.preventDefault();
    var payload = {
      title: document.getElementById('title').value,
      description: document.getElementById('description').value,
      area: document.getElementById('area').value,
      category: document.getElementById('category').value
    };

    API.createReport(payload).then(function () {
      event.target.reset();
      return API.getReports();
    }).then(function (data) {
      renderReports(document.getElementById('report-list'), data.reports || []);
    }).catch(function (err) {
      alert(err.message || 'Failed to create report');
    });
  });

  document.getElementById('logout-btn').addEventListener('click', function () {
    localStorage.removeItem('mtaafix_token');
    localStorage.removeItem('mtaafix_role');
    window.location.href = '/frontend/login.html';
  });
});
