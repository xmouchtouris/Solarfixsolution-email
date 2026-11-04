import { copyFileSync, mkdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const output = join(root, 'dist');
// Explicit public-file list: server code, .env, Git and node_modules never ship.
export const publicFiles = [
  'index.html', 'about.html', 'services.html', 'pictures.html', 'contact.html',
  'send-email.php', 'css/styles.css', 'js/scripts.js',
  'images/logo.JPG', 'images/solar-panels.jpg',
  ...Array.from({ length: 11 }, (_, i) => `images/installation${i + 1}.JPG`),
];
rmSync(output, { recursive: true, force: true });
for (const file of publicFiles) {
  mkdirSync(dirname(join(output, file)), { recursive: true });
  copyFileSync(join(root, file), join(output, file));
}
console.log(`Prepared ${publicFiles.length} public files in dist/. Upload the contents to Afrihost public_html.`);
