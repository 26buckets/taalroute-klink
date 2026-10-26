import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const git = (...args) => execFileSync('git', args, { maxBuffer: 32 * 1024 * 1024 });
const evidence = 'docs/klink-practice-explanations-20261026';
export const explanationFiles = [
  'app/learner-ui.css', 'components/product/practice-line.tsx',
  'public/practice-explanations/LICENTIE-ICONEN.txt', 'public/practice-explanations/app.js',
  'public/practice-explanations/index.html', 'public/practice-explanations/style.css',
  'scripts/test-picture-guide-browser.mjs', 'scripts/test-practice-explanations-browser.mjs',
  'scripts/test-route-panel-browser.mjs', 'scripts/check-practice-explanations-release.mjs',
  'scripts/test-practice-explanations-release.mjs', 'scripts/check-self-listening-release.mjs',
  'scripts/test-publication-proof.mjs', `${evidence}/README.md`, `${evidence}/TAALCONTROLE.md`,
];
export function verifyPracticeExplanationsRelease(release = JSON.parse(readFileSync('docs/klink-owner-release-practice-explanations-20261026.json')), readFile = readFileSync) {
  assert.equal(release.approvedBy, 'Nico');
  assert.equal(release.publicationApproved, true);
  assert.equal(release.userRequest, 'Ja, zo is het goed. Zet deze versie nu online in Klink, met behoud van de bestaande indeling en functies.');
  assert.equal(release.baselineSourceCommit, 'f76e30f459cbaab37606994eb30f9432e8eda4b5');
  assert.equal(release.liveSourceCommit, '346791a4b3952a3cc46d25ca419ac88ecbcc6efd');
  assert.equal(release.approvedPreviewCommit, '5c1aa430b3657cb141015768adf0e24968f99409');
  assert.equal(release.previousAuthorization, 'docs/klink-owner-release-self-listening-20261026.json');
  assert.equal(release.steps, 6); assert.equal(release.newAudio, 0); assert.equal(release.newLessons, 0);
  for (const [before, after] of [[release.liveSourceCommit, release.baselineSourceCommit], [release.baselineSourceCommit, release.approvedPreviewCommit], [release.approvedPreviewCommit, 'HEAD']]) git('merge-base', '--is-ancestor', before, after);
  assert.equal(sha(readFile(release.previousAuthorization)), sha(git('show', `${release.baselineSourceCommit}:${release.previousAuthorization}`)));
  const roots = ['app', 'components', 'hooks', 'data', 'lib', 'public', 'scripts'];
  const changed = git('diff', '--name-only', release.baselineSourceCommit, '--', ...roots).toString().trim().split('\n').filter(Boolean);
  const untracked = git('ls-files', '--others', '--exclude-standard', '--', ...roots).toString().trim().split('\n').filter(Boolean);
  assert.deepEqual([...new Set([...changed, ...untracked])].sort((a, b) => a.localeCompare(b)), explanationFiles.filter(file => !file.startsWith('docs/')).sort((a, b) => a.localeCompare(b)));
  // Publication adds only evidence and guards to the exact preview the owner approved.
  for (const file of explanationFiles.filter(file => /^(app|components|public)\//.test(file))) assert.equal(sha(readFile(file)), sha(git('show', `${release.approvedPreviewCommit}:${file}`)), file);
  const required = [...explanationFiles, ...['owner-request', 'live-baseline', 'review', 'source-manifest', 'source-drive-verification'].map(name => `${evidence}/${name}.json`)];
  assert.deepEqual(Object.keys(release.files).sort((a, b) => a.localeCompare(b)), required.sort((a, b) => a.localeCompare(b)));
  for (const [file, hash] of Object.entries(release.files)) assert.equal(sha(readFile(file)), hash, file);
  const manifest = JSON.parse(readFile(`${evidence}/source-manifest.json`));
  assert.deepEqual(manifest.map(row => row.path), [...explanationFiles, ...['owner-request', 'live-baseline', 'review'].map(name => `${evidence}/${name}.json`)]);
  for (const row of manifest) assert.equal(row.sha256, release.files[row.path]);
  const owner = JSON.parse(readFile(`${evidence}/owner-request.json`));
  assert.equal(owner.publicationRequest, release.userRequest);
  const review = JSON.parse(readFile(`${evidence}/review.json`));
  assert.equal(review.status, 'passed-local');
  for (const field of ['sixSteps', 'threeBrowserEngines', 'keyboardAndFocus', 'upwardWords', 'layoutPreserved', 'progressPreserved', 'existingRoutesPreserved', 'audioPreserved', 'contentAndMediaPreserved', 'buildPassed', 'typesPassed', 'scopedLintPassed']) assert.equal(review[field], true, field);
  const backup = JSON.parse(readFile(`${evidence}/source-drive-verification.json`));
  assert(backup.parentVerified && backup.downloadedByteIdentical && backup.zipCrcVerified);
  assert.equal(backup.manifestEntriesVerified, manifest.length);
  return release;
}
export function readBeforePracticeExplanations(file, release, readFile = readFileSync) {
  return release?.files[file] ? git('show', `${release.baselineSourceCommit}:${file}`) : readFile(file);
}
