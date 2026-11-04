import { rmSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
// Importing the build rebuilds dist/ using the explicit public-file list.
import { publicFiles } from './build-static.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const archive = join(root, 'solar-fix-solutions-afrihost.zip');
// Start fresh so files removed from the site cannot linger in an older ZIP.
rmSync(archive, { force: true });
const result = spawnSync('zip', ['-X', '-q', archive, ...publicFiles], {
  cwd: join(root, 'dist'),
  stdio: 'inherit',
});
if (result.error || result.status !== 0) {
  rmSync(archive, { force: true });
  console.error('Could not create the upload ZIP. This command needs the zip utility (included with macOS).');
  process.exit(1);
}
console.log(`Created ${archive} (${(statSync(archive).size / 1024 / 1024).toFixed(2)} MiB).`);
console.log('Upload this ZIP into public_html and extract it there. The files have no enclosing dist folder.');
