// Self-contained smoke test: boots the app on an ephemeral loopback port,
// exercises the API, prints PASS/FAIL, then exits. Finite runtime.
process.env.ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'test-admin-token-123';
process.env.CORS_ORIGIN = '*';

const http = require('http');
const { createApp } = require('../server');

let pass = 0, fail = 0;
function check(name, cond) { (cond ? pass++ : fail++); console.log((cond ? 'PASS ' : 'FAIL ') + name); }

function request(server, method, path, { json, headers } = {}) {
  return new Promise((resolve, reject) => {
    const { port } = server.address();
    const body = json ? JSON.stringify(json) : null;
    const req = http.request({ host: '127.0.0.1', port, method, path,
      headers: Object.assign({}, body ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } : {}, headers) },
      res => { let d = ''; res.on('data', c => d += c); res.on('end', () => resolve({ status: res.statusCode, body: d ? JSON.parse(d) : null })); });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

(async () => {
  const app = await createApp();
  const server = app.listen(0, '127.0.0.1');
  await new Promise(r => server.once('listening', r));
  try {
    const health = await request(server, 'GET', '/api/health');
    check('health ok', health.status === 200 && health.body.ok === true);

    const cats = await request(server, 'GET', '/api/categories');
    check('categories returns 8', cats.status === 200 && cats.body.length === 8);

    const stats = await request(server, 'GET', '/api/stats');
    check('stats has seeded reports', stats.body.total >= 5);

    const roads = await request(server, 'GET', '/api/reports?category=roads');
    check('filter by category', roads.body.every(r => r.cat === 'roads'));
    check('contact masked in list', roads.body.length === 0 || (!/0712345678/.test(JSON.stringify(roads.body))));

    const created = await request(server, 'POST', '/api/reports', { json: {
      cat: 'water', ward: 'Ruaka', landmark: 'Near market',
      desc: 'No water for 4 days in the whole estate.', name: 'Jane Wanjiru', phone: '0700123456' } });
    check('create returns 201 + id', created.status === 201 && /^MTF-\d{4}-/.test(created.body.id));
    check('created phone masked', !/0700123456/.test(JSON.stringify(created.body)));
    const id = created.body.id;

    const track = await request(server, 'GET', '/api/reports/' + id);
    check('track returns history', track.status === 200 && Array.isArray(track.body.history));

    const noAuth = await request(server, 'PATCH', '/api/reports/' + id + '/status', { json: { status: 1 } });
    check('status update without token -> 401', noAuth.status === 401);

    const withAuth = await request(server, 'PATCH', '/api/reports/' + id + '/status',
      { json: { status: 2, note: 'Assigned' }, headers: { 'X-Admin-Token': process.env.ADMIN_TOKEN } });
    check('status update with token -> 200', withAuth.status === 200 && withAuth.body.status === 2);

    const badCat = await request(server, 'POST', '/api/reports', { json: { cat: 'nope', ward: 'X', desc: 'y', name: 'z', phone: '1' } });
    check('invalid category -> 400', badCat.status === 400);

    const missing = await request(server, 'GET', '/api/reports/MTF-0000-ZZZZ');
    check('unknown id -> 404', missing.status === 404);
  } catch (e) {
    console.error(e); fail++;
  } finally {
    server.close();
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();