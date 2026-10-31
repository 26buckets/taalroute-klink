import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const git = (...args) => execFileSync('git', args, { maxBuffer: 128e6 });
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const sort = (a, b) => a.localeCompare(b);
const lines = bytes => bytes.toString().trim().split('\n').filter(Boolean).sort(sort);
export function verifyAutomaticImagesRelease(read = readFileSync) {
  const r = JSON.parse(read('docs/klink-owner-release-automatic-images-20261031.json'));
  assert.equal(r.approvedBy, 'Nico'); assert.equal(r.publicationApproved, true); assert.equal(r.generateImages, false);
  assert.equal(r.baselineSourceCommit, 'df2a0d3a6b973b7cf1ce3ebdfa92031a09ed0834');
  assert.equal(r.liveSourceCommit, 'e611ccae44d777f6d36db6aa100785fdfdf2363e');
  git('merge-base', '--is-ancestor', r.liveSourceCommit, r.baselineSourceCommit);
  git('merge-base', '--is-ancestor', r.baselineSourceCommit, 'HEAD');
  const roots = ['app', 'components', 'hooks', 'data', 'lib', 'public', 'scripts', 'db', 'drizzle', '.github', 'AGENTS.md', 'PUBLICATIE.md', 'docs/KLINK-DOCENTHANDLEIDING.md', 'vite.config.ts', 'next.config.ts', 'package.json', 'package-lock.json', 'wrangler.jsonc'];
  const changed = [...new Set([...lines(git('diff', '--name-only', r.baselineSourceCommit, '--', ...roots)), ...lines(git('ls-files', '--others', '--exclude-standard', '--', ...roots))])].sort(sort);
  assert.deepEqual(changed, [...r.changedFiles].sort(sort));
  const allowed = ['data/klink-image-preparation.json', 'package.json', 'package-lock.json', 'scripts/prepare-images.mjs', 'scripts/test-prepare-images.mjs', 'scripts/check-automatic-images-release-20261031.mjs', 'scripts/test-automatic-images-release-20261031.mjs', 'scripts/check-image-size-release-20261031.mjs'];
  assert(changed.every(file => allowed.includes(file)), 'Only automatic preparation and its checks');
  for (const [file, hash] of Object.entries(r.files)) assert.equal(sha(read(file)), hash, file);
  for (const file of changed) assert(r.files[file], file);
  assert.equal(git('diff', '--name-only', r.baselineSourceCommit, '--', 'app', 'components', 'lib', 'public').length, 0, 'No UI, source media, audio or application behaviour change');
  assert.deepEqual(JSON.parse(read('data/klink-image-preparation.json')), {});
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.scripts.predeploy, 'npm run images:prepare');
  assert.equal(pkg.scripts.prebuild, 'npm run images:check && node scripts/write-klink-release.mjs');
  assert.equal(pkg.scripts.deploy, 'npm run check:publication && npm run build && wrangler deploy --config dist/server/wrangler.json');
  assert.equal(pkg.scripts['images:prepare'], 'node scripts/prepare-images.mjs');
  assert.equal(pkg.scripts['images:check'], 'node scripts/prepare-images.mjs --check');
  assert.equal(pkg.devDependencies.sharp, '0.34.5');
  const review = JSON.parse(read('docs/automatic-images-20261031/review.json'));
  for (const key of ['preparation', 'sizeGuard', 'idempotence', 'staleSource', 'originalsPreserved', 'vectorsProtected', 'actualResolver', 'build', 'types', 'lint', 'localOnly']) assert.equal(review[key], true, key);
  const backup = JSON.parse(read('docs/automatic-images-20261031/backup.json'));
  assert(backup.verified && backup.driveId && backup.sha256);
  for (const file of changed) assert.equal(backup.files[file], r.files[file], file);
  return r;
}
export function readBeforeAutomaticImages(file, r, read = readFileSync) {
  return r.changedFiles.includes(file) || r.historicalFiles.includes(file) ? git('show', r.baselineSourceCommit + ':' + file) : read(file);
}
