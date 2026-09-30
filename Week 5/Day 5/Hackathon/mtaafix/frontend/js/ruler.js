// Area ruler console: sign in, post reports (fires AI SMS), manage statuses.
(function () {
  'use strict';
  var Api = window.MtaafixApi, esc = UI.esc, toast = UI.toast, fmtDate = UI.fmtDate;
  if (!Api.rulerToken() && Api.residentToken()) {
    window.location.replace('index.html');
    return;
  }
  var CATS = {}, STATUSES = [], ME = null;
  var approvalPollTimer = null, approvalRefreshTimer = null;
  var knownLoginRequestIds = null;

  function show(view) {
    document.getElementById('loginView').classList.toggle('hide', view !== 'login');
    document.getElementById('dashView').classList.toggle('hide', view !== 'dash');
    document.getElementById('loginNavBtn').classList.toggle('hide', view !== 'dash');
    document.getElementById('logoutBtn').classList.toggle('hide', view !== 'dash');
  }

  function returnToLogin() {
    Api.rulerLogout().then(function () {
      finishApprovalWait();
      if (approvalRefreshTimer) window.clearInterval(approvalRefreshTimer);
      approvalRefreshTimer = null;
      knownLoginRequestIds = null;
      document.getElementById('username').value = '';
      document.getElementById('password').value = '';
      show('login');
      document.getElementById('username').focus();
    });
  }

  function stopApprovalPolling() {
    if (approvalPollTimer) window.clearTimeout(approvalPollTimer);
    approvalPollTimer = null;
  }

  function finishApprovalWait(message, kind) {
    stopApprovalPolling();
    document.getElementById('loginPending').classList.add('hide');
    document.getElementById('loginForm').classList.remove('hide');
    if (message) toast(message, kind || 'err');
  }

  function pollLoginApproval(requestId) {
    Api.rulerLoginRequestStatus(requestId).then(function (result) {
      if (result.status === 'pending') {
        // Keep checking while the ruler leaves this page open for the admin's decision.
        approvalPollTimer = window.setTimeout(function () { pollLoginApproval(requestId); }, 3000);
        return;
      }
      if (result.status === 'approved' && result.token) {
        finishApprovalWait();
        return bootstrap().then(enterDash).then(function () { toast('Login approved', 'ok'); });
      }
      var message = result.status === 'denied' ? 'The administrator denied this login request.'
        : result.status === 'expired' ? 'This login request expired. Please sign in again.'
          : 'This login request is no longer available. Please sign in again.';
      finishApprovalWait(message, 'err');
    }).catch(function () {
      approvalPollTimer = window.setTimeout(function () { pollLoginApproval(requestId); }, 5000);
    });
  }

  function beginLoginApproval(requestId) {
    document.getElementById('password').value = '';
    document.getElementById('loginForm').classList.add('hide');
    document.getElementById('loginPending').classList.remove('hide');
    toast('Waiting for administrator approval', 'ok');
    pollLoginApproval(requestId);
  }

  function loadLoginRequests() {
    Api.rulerLoginRequests().then(function (requests) {
      var container = document.getElementById('loginRequests');
      var currentIds = requests.map(function (request) { return String(request.id); });
      if (knownLoginRequestIds) {
        // Notify the signed-in admin when the poll finds a new request.
        var hasNewRequest = currentIds.some(function (id) { return knownLoginRequestIds.indexOf(id) === -1; });
        if (hasNewRequest) toast('An area ruler login needs approval', 'ok');
      }
      knownLoginRequestIds = currentIds;
      if (!requests.length) {
        container.innerHTML = '<p class="rate-info">No pending login requests.</p>';
        return;
      }
      container.innerHTML = requests.map(function (request) {
        return '<article class="login-request-item">' +
          '<div><strong>' + esc(request.name) + '</strong><div class="rate-info">' + esc(request.username) +
          ' · ' + esc(request.area) + ' · ' + fmtDate(request.created) + '</div></div>' +
          '<div class="login-request-actions"><button class="btn primary" data-login-decision="approved" data-request-id="' + request.id + '">Approve</button>' +
          '<button class="btn danger" data-login-decision="denied" data-request-id="' + request.id + '">Deny</button></div>' +
          '</article>';
      }).join('');
      container.querySelectorAll('[data-login-decision]').forEach(function (button) {
        button.addEventListener('click', function () {
          button.disabled = true;
          Api.decideRulerLoginRequest(button.getAttribute('data-request-id'), button.getAttribute('data-login-decision'))
            .then(function (result) {
              toast(result.status === 'approved' ? 'Login approved' : 'Login denied', 'ok');
              loadLoginRequests();
            }).catch(function (err) {
              button.disabled = false;
              toast(err.message, 'err');
            });
        });
      });
    }).catch(function (err) {
      if (err.status !== 401 && err.status !== 403) toast(err.message, 'err');
    });
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
      document.getElementById('loginApprovalPanel').style.display = ME.role === 'admin' ? '' : 'none';
      show('dash');
      loadFeed();
      if (ME.role === 'admin') {
        loadLoginRequests();
        if (!approvalRefreshTimer) approvalRefreshTimer = window.setInterval(loadLoginRequests, 10000);
      } else if (approvalRefreshTimer) {
        window.clearInterval(approvalRefreshTimer);
        approvalRefreshTimer = null;
      }
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
    Api.rulerLogin(u, p).then(function (result) {
      if (result.approval_required) {
        beginLoginApproval(result.request_id);
        return;
      }
      return bootstrap().then(enterDash).then(function () { toast('Welcome back', 'ok'); });
    })
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
  document.getElementById('refreshLoginRequests').addEventListener('click', loadLoginRequests);
  document.getElementById('loginNavBtn').addEventListener('click', returnToLogin);
  document.getElementById('logoutBtn').addEventListener('click', function () {
    returnToLogin();
  });

  // auto-resume session
  if (Api.rulerToken()) {
    bootstrap().then(enterDash).catch(function () { show('login'); bootstrap(); });
  } else {
    show('login');
    bootstrap();
  }
})();