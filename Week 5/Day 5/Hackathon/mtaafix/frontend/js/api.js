// Mtaafix API client (browser JS). Compiled counterpart of ts/api.ts.
// Handles the resident + ruler REST endpoints and token storage.
(function (global) {
  'use strict';

  // Use same-origin requests in production. Keep the localhost fallback for
  // developing the frontend through Live Server.
  var isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  var BASE = isLocalhost && window.location.port !== '4000' ? 'http://localhost:4000' : '';

  // Token persistence, most-durable first. localStorage survives restarts;
  // sessionStorage survives the login->dashboard navigation within the tab
  // even when localStorage is blocked (private mode); the in-memory map is a
  // last resort for the current page. Without a working fallback a blocked
  // localStorage write left the token unsaved, so the dashboard saw no token
  // and bounced straight back to the login page.
  var memTokens = {};

  function tokenKey(kind) { return 'mtaafix.' + kind + '.token'; }
  function _read(store, key) { try { return store ? store.getItem(key) : null; } catch (e) { return null; } }
  function _write(store, key, val) {
    try { if (!store) return; val ? store.setItem(key, val) : store.removeItem(key); } catch (e) {}
  }
  function getToken(kind) {
    var key = tokenKey(kind);
    var v = _read(window.localStorage, key);
    if (v != null) return v;
    v = _read(window.sessionStorage, key);
    if (v != null) return v;
    return memTokens[kind] || null;
  }
  function setToken(kind, t) {
    var key = tokenKey(kind);
    if (t) { memTokens[kind] = t; } else { delete memTokens[kind]; }
    _write(window.localStorage, key, t);
    _write(window.sessionStorage, key, t);
  }

  function request(method, path, body, kind) {
    var headers = { 'Content-Type': 'application/json' };
    var tok = kind ? getToken(kind) : null;
    if (tok) headers['Authorization'] = 'Bearer ' + tok;
    return fetch(BASE + path, {
      method: method,
      headers: headers,
      body: body != null ? JSON.stringify(body) : undefined
    }).then(function (res) {
      return res.text().then(function (txt) {
        var data = null;
        if (txt) {
          try {
            data = JSON.parse(txt);
          } catch (parseError) {
            var responseError = new Error('Server returned an invalid response (HTTP ' + res.status + ')');
            responseError.status = res.status;
            responseError.data = txt;
            throw responseError;
          }
        }
        if (!res.ok) {
          var msg = (data && (data.error || (data.errors && data.errors.join(', ')))) || ('HTTP ' + res.status);
          var err = new Error(msg); err.status = res.status; err.data = data; throw err;
        }
        return data;
      });
    });
  }

  var Api = {
    // reference
    categories: function () { return request('GET', '/api/categories'); },
    statuses: function () { return request('GET', '/api/statuses'); },
    areas: function () { return request('GET', '/api/areas'); },
    stats: function () { return request('GET', '/api/stats'); },

    // resident session
    residentToken: function () { return getToken('resident'); },
    residentLogin: function (phone, name, area, subscribe) {
      return request('POST', '/api/residents/login',
          { phone: phone, name: name, area: area, subscribe: subscribe !== false })
        .then(function (s) { setToken('resident', s.token); return s; });
    },
    setSubscription: function (subscribe) {
      return request('POST', '/api/residents/subscription', { subscribe: subscribe !== false }, 'resident');
    },
    residentLogout: function () {
      return request('POST', '/api/residents/logout', {}, 'resident')
        .catch(function () {}).then(function () { setToken('resident', null); });
    },
    residentMe: function () { return request('GET', '/api/residents/me', null, 'resident'); },
    notifications: function () { return request('GET', '/api/residents/notifications', null, 'resident'); },
    confirmNotification: function (id) { return request('POST', '/api/residents/notifications/' + id + '/confirm', {}, 'resident'); },

    // reports (public read + resident rate)
    reports: function (params) {
      var q = new URLSearchParams();
      if (params) Object.keys(params).forEach(function (k) { if (params[k]) q.set(k, params[k]); });
      var qs = q.toString();
      return request('GET', '/api/reports' + (qs ? '?' + qs : ''), null, 'resident');
    },
    report: function (id) { return request('GET', '/api/reports/' + id, null, 'resident'); },
    rate: function (id, stars) { return request('POST', '/api/reports/' + id + '/rate', { stars: stars }, 'resident'); },

    // ruler session + posting
    rulerToken: function () { return getToken('ruler'); },
    rulerLogin: function (username, password) {
      return request('POST', '/api/ruler/login', { username: username, password: password })
        .then(function (s) { setToken('ruler', s.token); return s; });
    },
    rulerLogout: function () {
      return request('POST', '/api/ruler/logout', {}, 'ruler')
        .catch(function () {}).then(function () { setToken('ruler', null); });
    },
    rulerMe: function () { return request('GET', '/api/ruler/me', null, 'ruler'); },
    postReport: function (payload) { return request('POST', '/api/ruler/reports', payload, 'ruler'); },
    rulerReports: function (params) {
      var q = new URLSearchParams();
      if (params) Object.keys(params).forEach(function (k) { if (params[k]) q.set(k, params[k]); });
      var qs = q.toString();
      return request('GET', '/api/ruler/reports' + (qs ? '?' + qs : ''), null, 'ruler');
    },
    setStatus: function (id, status, note) { return request('PATCH', '/api/ruler/reports/' + id + '/status', { status: status, note: note }, 'ruler'); },
    deleteReport: function (id) { return request('DELETE', '/api/ruler/reports/' + id, null, 'ruler'); },
    rulerStats: function () { return request('GET', '/api/ruler/stats', null, 'ruler'); },
    listRulers: function () { return request('GET', '/api/ruler/rulers', null, 'ruler'); },
    createRuler: function (payload) { return request('POST', '/api/ruler/rulers', payload, 'ruler'); }
  };

  global.MtaafixApi = Api;
})(window);