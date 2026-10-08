function getHealth(request, response) {
  if (request.method !== 'GET') {
    response.writeHead(405, { Allow: 'GET', 'Content-Type': 'application/json' });
    return response.end(JSON.stringify({ error: 'Method not allowed' }));
  }
  response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify({ status: 'ok', app: 'LinguaQuest' }));
}

module.exports = { getHealth };
