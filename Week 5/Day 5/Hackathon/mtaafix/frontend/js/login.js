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
    if (!phone) { toast('Please enter your phone number', 'err'); return; }
    var btn = document.getElementById('submitBtn');
    btn.disabled = true;
    Api.residentLogin(phone, name || undefined, area || undefined).then(function () {
      toast('Signed in! Redirecting\u2026', 'ok');
      setTimeout(function () { window.location.href = 'index.html'; }, 600);
    }).catch(function (err) {
      btn.disabled = false;
      toast(err.message || 'Sign-in failed', 'err');
    });
  });
})();