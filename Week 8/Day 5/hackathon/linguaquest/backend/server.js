const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const healthRoutes = require('./routes/healthRoutes');

const projectRoot = path.resolve(__dirname, '..');
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav'
};

const server = http.createServer((request, response) => {
  const pathname = new URL(request.url, 'http://localhost').pathname;
  if (pathname === '/api/health') {
    return healthRoutes(request, response);
  }

  const requested = pathname === '/' ? '/frontend/index.html' : decodeURIComponent(pathname);
  const filePath = path.resolve(projectRoot, `.${requested}`);
  if (!filePath.startsWith(`${projectRoot}${path.sep}`)) {
    response.writeHead(403);
    return response.end('Forbidden');
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      response.writeHead(error.code === 'ENOENT' ? 404 : 500, { 'Content-Type': 'text/plain; charset=utf-8' });
      return response.end(error.code === 'ENOENT' ? 'Not found' : 'Unable to read requested file');
    }
    response.writeHead(200, {
      'Content-Type': mimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff'
    });
    response.end(content);
  });
});

const port = Number(process.env.PORT) || 5174;
server.listen(port, () => {
  console.log(`LinguaQuest is ready at http://localhost:${port}`);
});
