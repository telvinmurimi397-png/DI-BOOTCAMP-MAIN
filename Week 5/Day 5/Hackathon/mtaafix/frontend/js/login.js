// Resident login page logic.
(function () {
  'use strict';
  var Api = window.MtaafixApi, toast = UI.toast;

  // Already signed in? go straight to the feed.
  if (Api.residentToken()) { window.location.href = 'index.html'; return; }

  Api.areas().then(function (areas) {
    var sel = document.getElementById('area');
    areas.forEach(function (a) {
      var o = document.createElement('option');
      o.value = a.id; o.textContent = a.name; sel.appendChild(o);
    });
  }).catch(function () {});

  document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var phone = document.getElementById('phone').value.trim();
    var name = document.getElementById('name').value.trim();
    var area = document.getElementById('area').value;
    var subscribe = document.getElementById('subscribe').checked;
    if (!phone) { toast('Please enter your phone number', 'err'); return; }
    var btn = document.getElementById('submitBtn');
    btn.disabled = true;
    Api.residentLogin(phone, name || undefined, area || undefined, subscribe).then(function () {
      toast(subscribe ? 'Signed in \u00b7 SMS alerts on' : 'Signed in', 'ok');
      // Navigate right away; the session token is already stored.
      window.location.assign('index.html');
    }).catch(function (err) {
      btn.disabled = false;
      toast(err.message || 'Sign-in failed', 'err');
    });
  });
})();