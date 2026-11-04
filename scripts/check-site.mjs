import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const pages = ['index.html', 'about.html', 'services.html', 'pictures.html', 'contact.html'];
const content = new Map(pages.map(page => [page, readFileSync(resolve(root, page), 'utf8')]));
let references = 0;
for (const [page, html] of content) {
  assert.equal((html.match(/<h1\b/g) || []).length, 1, `${page}: expected one h1`);
  assert.match(html, /<meta name="description"/, `${page}: missing description`);
  assert.match(html, /<main id="main">/, `${page}: missing main landmark`);
  assert.match(html, /aria-current="page"/, `${page}: missing active navigation`);
  assert.doesNotMatch(html, /railway|src="server\.js"|http:\/\//i, `${page}: legacy integration`);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(ids.length, new Set(ids).size, `${page}: duplicate IDs`);
  for (const match of html.matchAll(/\b(?:href|src|action)="([^"]+)"/g)) {
    const value = match[1];
    if (/^(https?:|mailto:|tel:)/.test(value)) continue;
    const [local, anchor] = value.split('#');
    const file = decodeURIComponent(local.split('?')[0]) || page;
    assert.ok(existsSync(resolve(root, file)), `${page}: missing ${value}`);
    if (anchor && content.has(file)) assert.ok(content.get(file).includes(`id="${anchor}"`), `${page}: missing anchor ${value}`);
    references++;
  }
  for (const match of html.matchAll(/<img\b[^>]*>/g)) {
    assert.match(match[0], /\balt="/, `${page}: image without alt`);
  }
}
const contact = content.get('contact.html');
assert.match(contact, /action="send-email\.php" method="post"/);
const gallery = content.get('pictures.html');
const photoCount = (gallery.match(/class="gallery-open"/g) || []).length;
assert.ok(photoCount > 0, 'Gallery must contain photographs');
assert.ok(gallery.includes(`${photoCount} PHOTOGRAPHS`), 'Gallery total must match the photographs');
assert.ok(gallery.includes(`1 / ${photoCount}</span>`), 'Initial lightbox counter must match the photographs');
console.log(`Checked ${pages.length} pages and ${references} local references; navigation, images, anchors and PHP form route are present.`);
