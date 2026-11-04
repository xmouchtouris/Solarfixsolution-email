'use strict';
// Local UI preview only. Production uses Afrihost's PHP server and send-email.php.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, 'dist');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.jpg': 'image/jpeg' };

function createPreviewServer() {
  return http.createServer((req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-store');
    let pathname;
    try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
    catch { res.writeHead(400); res.end('Invalid URL'); return; }
    if (pathname === '/send-email.php') {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'This local preview cannot send email. Open https://solarfixsolutions.co.za/contact.html to test the live contact form.' }));
      return;
    }
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405, { Allow: 'GET, HEAD' }); res.end(); return; }
    const relative = pathname === '/' ? 'index.html' : pathname.slice(1);
    const filename = path.resolve(root, relative);
    const type = types[path.extname(filename).toLowerCase()];
    if (!type || !filename.startsWith(root + path.sep) || relative.split('/').some(part => part.startsWith('.'))) {
      res.writeHead(404); res.end('Not found'); return;
    }
    fs.readFile(filename, (error, data) => {
      if (error) { res.writeHead(404); res.end('Not found'); return; }
      res.writeHead(200, { 'Content-Type': type });
      res.end(req.method === 'HEAD' ? undefined : data);
    });
  });
}
if (require.main === module) {
  if (!fs.existsSync(path.join(root, 'index.html'))) { console.error('Run npm run build first.'); process.exit(1); }
  const port = Number(process.env.PORT || 8080);
  createPreviewServer().listen(port, '127.0.0.1', () => console.log(`Local UI preview: http://127.0.0.1:${port}\nEmail sending requires PHP-enabled hosting.`));
}
module.exports = { createPreviewServer };
