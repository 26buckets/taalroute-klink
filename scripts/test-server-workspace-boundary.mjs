import assert from 'node:assert/strict';
import { globSync, readFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';

const before = process.argv[2];
assert(before, 'Pass the preserved build before the server-only exclusion');
const files = root => globSync('**/*', { cwd: root, dot: true }).filter(file => statSync(`${root}/${file}`).isFile());
const oldServer = files(`${before}/server`).filter(file => file.endsWith('.js'));
const server = files('dist/server').filter(file => file.endsWith('.js'));
const client = files('dist/client');
const bytes = (root, paths) => paths.reduce((sum, file) => sum + statSync(`${root}/${file}`).size, 0);
const beforeBytes = bytes(`${before}/server`, oldServer);
const afterBytes = bytes('dist/server', server);
assert(afterBytes < beforeBytes / 2, 'Browser workspace data must no longer dominate the server package');
for (const name of ['practice-workspace', 'teacher-classroom', 'learner-app', 'staff-apps']) {
  const workspaceModule = new RegExp(`(?:^|/)${name}-.*\\.js$`);
  assert(!server.some(file => workspaceModule.test(file)), `${name} should not ship to the server`);
  assert(client.some(file => workspaceModule.test(file)), `${name} must remain available in the browser`);
}
const hash = file => createHash('sha256').update(readFileSync(file)).digest('hex');
// Build provenance and separately tested header policy are not media.
const publicFiles = files('public').filter(file => !['release.json', '_headers'].includes(file));
for (const file of publicFiles) {
  assert.equal(hash(`dist/client/${file}`), hash(`${before}/client/${file}`), `Preserve public media: ${file}`);
}
console.log(JSON.stringify({ beforeBytes, afterBytes, publicFilesUnchanged: publicFiles.length, browserWorkspacesPresent: true }));
