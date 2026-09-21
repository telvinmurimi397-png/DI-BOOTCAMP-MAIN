// Resident feed: list reports, rate them, view SMS alerts. Residents cannot post.
(function () {
  'use strict';
  var Api = window.MtaafixApi, esc = UI.esc, toast = UI.toast, fmtDate = UI.fmtDate;

  if (!Api.residentToken()) { window.location.href = 'login.html'; return; }

  var CATS = {}, STATUSES = [];

  Api.residentMe().then(function (r) {
    var u = r.user;
    document.getElementById('whoami').textContent =
      (u.name ? u.name : 'Resident') + ' \u00b7 ' + (u.phone || '');
  }).catch(function (err) {
    if (err.status === 401) { window.location.href = 'login.html'; }
  });

  function starWidget(report) {
    var mine = report.rating && report.rating.mine ? report.rating.mine : 0;
    var html = '<span class="stars" data-id="' + esc(report.id) + '">';
    for (var i = 1; i <= 5; i++) {
      html += '<span class="s ' + (i <= mine ? 'on' : '') + '" data-v="' + i + '">\u2605</span>';
    }
    html += '</span>';
    var avg = report.rating ? report.rating.avg : 0;
    var cnt = report.rating ? report.rating.count : 0;
    html += ' <span class="rate-info">' + (cnt ? (avg + ' avg \u00b7 ' + cnt + ' rating' + (cnt === 1 ? '' : 's')) : 'No ratings yet') + '</span>';
    return html;
  }

  function cardHtml(r) {
    var cat = CATS[r.cat] || { icon: '\ud83d\udccc', label: r.cat };
    return '<div class="card">' +
      '<div class="row" style="justify-content:space-between">' +
        '<h3>' + esc(cat.icon) + ' ' + esc(cat.label) + '</h3>' +
        '<span class="pill status' + r.status + '">' + esc(r.statusLabel) + '</span>' +
      '</div>' +
      '<div class="meta">' +
        '<span class="pill">' + esc(r.areaName || r.area) + '</span>' +
        '<span class="pill">' + esc(r.ward) + '</span>' +
        (r.landmark ? '<span class="pill">' + esc(r.landmark) + '</span>' : '') +
      '</div>' +
      '<div class="desc">' + esc(r.desc) + '</div>' +
      '<div class="meta">Posted by ' + esc(r.author) + ' \u00b7 ' + fmtDate(r.created) + ' \u00b7 Ref ' + esc(r.id) + '</div>' +
      '<div class="row" style="margin-top:8px">' + starWidget(r) + '</div>' +
    '</div>';
  }

  function attachRating() {
    document.querySelectorAll('.stars').forEach(function (widget) {
      var id = widget.getAttribute('data-id');
      widget.querySelectorAll('.s').forEach(function (star) {
        star.addEventListener('mouseenter', function () {
          var v = +star.getAttribute('data-v');
          widget.querySelectorAll('.s').forEach(function (s) { s.classList.toggle('on', +s.getAttribute('data-v') <= v); });
        });
        star.addEventListener('click', function () {
          var v = +star.getAttribute('data-v');
          Api.rate(id, v).then(function (res) {
            toast('Thanks for rating! (' + res.rating.avg + ' avg)', 'ok');
          }).catch(function (err) { toast(err.message, 'err'); load(); });
        });
      });
    });
  }

  function load() {
    var params = {
      area: document.getElementById('fArea').value,
      category: document.getElementById('fCat').value,
      status: document.getElementById('fStatus').value
    };
    Api.reports(params).then(function (list) {
      var feed = document.getElementById('feed');
      document.getElementById('empty').classList.toggle('hide', list.length > 0);
      feed.innerHTML = list.map(cardHtml).join('');
      attachRating();
    }).catch(function (err) {
      if (err.status === 401) { window.location.href = 'login.html'; return; }
      toast(err.message, 'err');
    });
  }

  function loadStats() {
    Api.stats().then(function (s) {
      document.getElementById('statRow').innerHTML =
        '<div class="stat"><b>' + s.total + '</b><span>Total reports</span></div>' +
        '<div class="stat"><b>' + s.active + '</b><span>In progress</span></div>' +
        '<div class="stat"><b>' + s.resolved + '</b><span>Resolved</span></div>' +
        '<div class="stat"><b>' + s.categories + '</b><span>Categories</span></div>';
    }).catch(function () {});
  }

  function loadNotifs() {
    Api.notifications().then(function (list) {
      var unconfirmed = list.filter(function (n) { return !n.confirmed; }).length;
      var c = document.getElementById('notifCount');
      c.textContent = unconfirmed ? '(' + unconfirmed + ')' : '';
      var box = document.getElementById('notifList');
      if (!list.length) { box.innerHTML = '<div class="empty">No alerts yet.</div>'; return; }
      box.innerHTML = list.map(function (n) {
        return '<div class="notif ' + (n.confirmed ? 'confirmed' : '') + '">' +
          '<div>' + esc(n.body) + '</div>' +
          '<div class="row" style="justify-content:space-between;margin-top:6px">' +
            '<span class="rate-info">' + fmtDate(n.created) + '</span>' +
            (n.confirmed ? '<span class="rate-info">\u2713 Confirmed</span>'
              : '<button class="btn primary" data-confirm="' + n.id + '">Confirm</button>') +
          '</div></div>';
      }).join('');
      box.querySelectorAll('[data-confirm]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          Api.confirmNotification(btn.getAttribute('data-confirm')).then(function () {
            toast('Confirmed', 'ok'); loadNotifs();
          }).catch(function (err) { toast(err.message, 'err'); });
        });
      });
    }).catch(function () {});
  }

  // bootstrap reference data + filters
  Promise.all([Api.categories(), Api.statuses(), Api.areas()]).then(function (res) {
    var cats = res[0], statuses = res[1], areas = res[2];
    STATUSES = statuses;
    cats.forEach(function (c) { CATS[c.id] = c; });
    UI.fillSelect(document.getElementById('fCat'), cats, 'id', 'label', 'All categories');
    UI.fillSelect(document.getElementById('fArea'), areas, 'id', 'name', 'All areas');
    var st = document.getElementById('fStatus');
    st.innerHTML = '<option value="">Any status</option>' +
      statuses.map(function (s, i) { return '<option value="' + i + '">' + esc(s) + '</option>'; }).join('');
    load();
  });
  loadStats();
  loadNotifs();

  document.getElementById('refreshBtn').addEventListener('click', function () { load(); loadStats(); });
  ['fArea', 'fCat', 'fStatus'].forEach(function (id) {
    document.getElementById(id).addEventListener('change', load);
  });
  document.getElementById('notifBtn').addEventListener('click', function () {
    document.getElementById('notifPanel').classList.toggle('hide'); loadNotifs();
  });
  document.getElementById('notifClose').addEventListener('click', function () {
    document.getElementById('notifPanel').classList.add('hide');
  });
  document.getElementById('logoutBtn').addEventListener('click', function () {
    Api.residentLogout().then(function () { window.location.href = 'login.html'; });
  });
})();