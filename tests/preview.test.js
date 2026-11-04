const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createPreviewServer } = require('../server.js');
let server;
let base;
before(async () => {
  server = createPreviewServer();
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => { if (server) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); } });

test('all pages and public assets are served', async () => {
  for (const route of ['/', '/about.html', '/services.html', '/pictures.html', '/contact.html', '/css/styles.css', '/js/scripts.js', '/images/coastal-rooftop-solar-array.jpg', '/images/deye-inverter-three-battery-installation.jpg', '/images/solar-fix-solutions-logo.jpg']) {
    const response = await fetch(base + route);
    assert.equal(response.status, 200, route);
    assert.ok((await response.arrayBuffer()).byteLength > 0, route);
  }
});
test('preview cannot expose secrets, source files or PHP source', async () => {
  for (const route of ['/.env', '/.git/config', '/server.js', '/package.json', '/node_modules/express/package.json', '/send-email.php', '/%2e%2e%2f.env']) {
    const response = await fetch(base + route);
    assert.notEqual(response.status, 200, route);
    assert.doesNotMatch(await response.text(), /<\?php|SMTP_PASS/);
  }
});
test('local contact preview reports failure instead of pretending to send mail', async () => {
  const response = await fetch(base + '/send-email.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({name:'Preview test'}) });
  assert.equal(response.status, 503);
  assert.equal((await response.json()).success, false);
});
test('Afrihost package contains only intended public files', () => {
  const root = path.join(__dirname, '..', 'dist');
  const files = fs.readdirSync(root, { recursive: true }).filter(file => fs.statSync(path.join(root, file)).isFile());
  assert.equal(files.length, 18);
  assert.ok(files.includes('send-email.php'));
  assert.ok(files.includes('index.html'));
  assert.ok(!files.some(file => /\.env|node_modules|server\.js|package|README|\.git/.test(file)));
  assert.ok(!files.some(file => /installation\d+\.JPG|logo\.JPG/.test(file)), 'Unselected legacy images must not ship');
});
