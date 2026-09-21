// Area ruler console: sign in, post reports (fires AI SMS), manage statuses.
(function () {
  'use strict';
  var Api = window.MtaafixApi, esc = UI.esc, toast = UI.toast, fmtDate = UI.fmtDate;
  var CATS = {}, STATUSES = [], ME = null;

  function show(view) {
    document.getElementById('loginView').classList.toggle('hide', view !== 'login');
    document.getElementById('dashView').classList.toggle('hide', view !== 'dash');
    document.getElementById('logoutBtn').classList.toggle('hide', view !== 'dash');
  }

  function bootstrap() {
    return Promise.all([Api.categories(), Api.statuses(), Api.areas()]).then(function (res) {
      var cats = res[0]; STATUSES = res[1]; var areas = res[2];
      cats.forEach(function (c) { CATS[c.id] = c; });
      UI.fillSelect(document.getElementById('pCat'), cats, 'id', 'label');
      UI.fillSelect(document.getElementById('pArea'), areas, 'id', 'name');
      UI.fillSelect(document.getElementById('nrArea'), areas, 'id', 'name');
      return areas;
    });
  }

  function enterDash() {
    return Api.rulerMe().then(function (r) {
      ME = r.user;
      document.getElementById('whoami').textContent = ME.name + ' \u00b7 ' + (ME.role === 'admin' ? 'super-admin' : ME.area);
      // area rulers are locked to their own area when posting
      var pArea = document.getElementById('pArea');
      if (ME.role === 'ruler') { pArea.value = ME.area; pArea.disabled = true; }
      document.getElementById('adminPanel').style.display = ME.role === 'admin' ? '' : 'none';
      show('dash');
      loadFeed();
    });
  }

  function statusSelect(r) {
    var opts = STATUSES.map(function (s, i) {
      return '<option value="' + i + '"' + (i === r.status ? ' selected' : '') + '>' + esc(s) + '</option>';
    }).join('');
    return '<select data-status="' + esc(r.id) + '">' + opts + '</select>';
  }

  function cardHtml(r) {
    var cat = CATS[r.cat] || { icon: '\ud83d\udccc', label: r.cat };
    var rating = r.rating || { avg: 0, count: 0 };
    return '<div class="card">' +
      '<div class="row" style="justify-content:space-between">' +
        '<h3>' + esc(cat.icon) + ' ' + esc(cat.label) + '</h3>' +
        '<span class="pill status' + r.status + '">' + esc(r.statusLabel) + '</span>' +
      '</div>' +
      '<div class="meta"><span class="pill">' + esc(r.areaName || r.area) + '</span>' +
        '<span class="pill">' + esc(r.ward) + '</span>' +
        (r.landmark ? '<span class="pill">' + esc(r.landmark) + '</span>' : '') + '</div>' +
      '<div class="desc">' + esc(r.desc) + '</div>' +
      '<div class="meta">Ref ' + esc(r.id) + ' \u00b7 ' + fmtDate(r.created) +
        ' \u00b7 \u2605 ' + rating.avg + ' (' + rating.count + ')</div>' +
      '<div class="row" style="margin-top:8px;justify-content:space-between">' +
        statusSelect(r) +
        '<button class="btn danger" data-del="' + esc(r.id) + '">Delete</button>' +
      '</div></div>';
  }

  function loadFeed() {
    Api.rulerReports().then(function (list) {
      document.getElementById('empty').classList.toggle('hide', list.length > 0);
      var feed = document.getElementById('feed');
      feed.innerHTML = list.map(cardHtml).join('');
      feed.querySelectorAll('[data-status]').forEach(function (sel) {
        sel.addEventListener('change', function () {
          Api.setStatus(sel.getAttribute('data-status'), +sel.value).then(function () {
            toast('Status updated', 'ok'); loadFeed();
          }).catch(function (e) { toast(e.message, 'err'); });
        });
      });
      feed.querySelectorAll('[data-del]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (!confirm('Delete this report?')) return;
          Api.deleteReport(btn.getAttribute('data-del')).then(function () {
            toast('Deleted', 'ok'); loadFeed();
          }).catch(function (e) { toast(e.message, 'err'); });
        });
      });
    }).catch(function (err) {
      if (err.status === 401) { show('login'); }
      else toast(err.message, 'err');
    });
  }

  // --- events ---
  document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var u = document.getElementById('username').value.trim();
    var p = document.getElementById('password').value;
    Api.rulerLogin(u, p).then(function () { return bootstrap().then(enterDash); })
      .then(function () { toast('Welcome back', 'ok'); })
      .catch(function (err) { toast(err.message || 'Login failed', 'err'); });
  });

  document.getElementById('postBtn').addEventListener('click', function () {
    var payload = {
      cat: document.getElementById('pCat').value,
      area: document.getElementById('pArea').value,
      ward: document.getElementById('pWard').value.trim(),
      landmark: document.getElementById('pLandmark').value.trim(),
      desc: document.getElementById('pDesc').value.trim()
    };
    if (!payload.ward || !payload.desc) { toast('Ward and description are required', 'err'); return; }
    var btn = document.getElementById('postBtn'); btn.disabled = true;
    Api.postReport(payload).then(function (r) {
      document.getElementById('pWard').value = '';
      document.getElementById('pLandmark').value = '';
      document.getElementById('pDesc').value = '';
      document.getElementById('postHint').textContent = 'AI SMS sent to ' + (r.smsSent || 0) + ' resident(s).';
      toast('Posted \u00b7 ' + (r.smsSent || 0) + ' residents notified by SMS', 'ok');
      btn.disabled = false; loadFeed();
    }).catch(function (err) { btn.disabled = false; toast(err.message, 'err'); });
  });

  document.getElementById('addRulerBtn').addEventListener('click', function () {
    var payload = {
      username: document.getElementById('nrUser').value.trim(),
      name: document.getElementById('nrName').value.trim(),
      password: document.getElementById('nrPass').value,
      role: 'ruler',
      area: document.getElementById('nrArea').value
    };
    Api.createRuler(payload).then(function () {
      toast('Ruler created', 'ok');
      document.getElementById('nrUser').value = '';
      document.getElementById('nrName').value = '';
      document.getElementById('nrPass').value = '';
    }).catch(function (err) { toast(err.message, 'err'); });
  });

  document.getElementById('refreshBtn').addEventListener('click', loadFeed);
  document.getElementById('logoutBtn').addEventListener('click', function () {
    Api.rulerLogout().then(function () { show('login'); });
  });

  // auto-resume session
  if (Api.rulerToken()) {
    bootstrap().then(enterDash).catch(function () { show('login'); bootstrap(); });
  } else {
    show('login');
    bootstrap();
  }
})();