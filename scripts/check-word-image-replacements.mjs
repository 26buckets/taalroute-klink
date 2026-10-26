import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { assertImageMappings } from './check-image-release.mjs';

const evidence = 'docs/klink-word-images-20261026';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const git = (...args) => execFileSync('git', args, { maxBuffer: 32 * 1024 * 1024 }).toString();
const read = file => JSON.parse(readFileSync(file));
const expectedCodes = ['K201', 'K202', 'K207', 'K224', 'K230', 'K311', 'K323', 'K325', 'K329', 'K340', 'K352', 'K364', 'K368', 'K369', 'K370'];

export function verifyWordImageReplacements(release = read('docs/klink-owner-release-word-images-20261026.json'), readFile = readFileSync) {
  assert.equal(release.approvedBy, 'Nico');
  assert.equal(release.publicationApproved, true);
  assert.equal(release.baselineSourceCommit, 'cc2ef6f4f18ddf20fb20e5f142d95a863c72bc8c');
  assert.equal(release.liveSourceCommit, 'cf3a14faaf0d0e572f2335946b83dad54ca3b4fd');
  assert.equal(release.previousAuthorization, 'docs/klink-owner-release-dialogue-playback-20261026.json');
  assert.equal(release.userRequest, read(`${evidence}/owner-request.json`).publicationRequest);
  assert.equal(release.images, 15);
  assert.equal(release.quantityVariantsPublished, false);
  git('merge-base', '--is-ancestor', release.liveSourceCommit, release.baselineSourceCommit);
  git('merge-base', '--is-ancestor', release.baselineSourceCommit, 'HEAD');
  assert.equal(sha(readFile(release.previousAuthorization)), sha(git('show', `${release.baselineSourceCommit}:${release.previousAuthorization}`)));

  const images = JSON.parse(readFile(`${evidence}/images.json`));
  assert.deepEqual(images.map(row => row.code).sort((a, b) => a.localeCompare(b)), expectedCodes);
  assert.deepEqual(images.filter(row => ['K202', 'K352', 'K368', 'K369'].includes(row.code)).map(row => row.kind), Array(4).fill('digit'));
  for (const row of images) {
    assert.equal(row.image, `/package-media/word-images-20261026/${row.code.toLowerCase()}.webp`);
    assert.equal(row.pixelIdentical, true);
    assert.equal(row.driveReadbackIdentical, true);
    assert(row.originalDriveId && /^[a-f0-9]{64}$/.test(row.originalSha256));
    assert.equal(sha(readFile(`public${row.image}`)), row.sha256, row.code);
  }
  const before = JSON.parse(git('show', `${release.baselineSourceCommit}:data/klink-media.json`));
  assert.equal(assertImageMappings(before, JSON.parse(readFile('data/klink-media.json')), images), 15);
  const variants = JSON.parse(readFile(`${evidence}/quantity-variants.json`));
  assert.deepEqual(variants.map(row => row.code).sort((a, b) => a.localeCompare(b)), ['K202', 'K352', 'K368']);
  for (const variant of variants) {
    assert.equal(variant.role, 'quantity-variant-retained-not-active');
    assert(variant.driveVerified && variant.driveId);
    assert.notEqual(variant.sha256, images.find(row => row.code === variant.code).originalSha256);
  }

  const runtime = ['data/klink-media.json', ...images.map(row => `public${row.image}`)].sort((a, b) => a.localeCompare(b));
  const roots = ['app', 'components', 'hooks', 'data', 'lib', 'public'];
  const changed = git('diff', '--name-only', release.baselineSourceCommit, '--', ...roots).trim().split('\n').filter(Boolean);
  const untracked = git('ls-files', '--others', '--exclude-standard', '--', ...roots).trim().split('\n').filter(Boolean);
  assert.deepEqual([...new Set([...changed, ...untracked])].sort((a, b) => a.localeCompare(b)), runtime, 'Only fifteen image mappings and their files may change');
  assert.deepEqual(release.changedFiles.filter(file => /^(app|components|hooks|data|lib|public)\//.test(file)).sort((a, b) => a.localeCompare(b)), runtime);
  const codeRoots = [...roots, 'scripts'];
  const codeChanges = git('diff', '--name-only', release.baselineSourceCommit, '--', ...codeRoots).trim().split('\n').filter(Boolean);
  const newCode = git('ls-files', '--others', '--exclude-standard', '--', ...codeRoots).trim().split('\n').filter(Boolean);
  assert.deepEqual([...new Set([...codeChanges, ...newCode])].sort((a, b) => a.localeCompare(b)), release.changedFiles.filter(file => /^(app|components|hooks|data|lib|public|scripts)\//.test(file)).sort((a, b) => a.localeCompare(b)));
  for (const file of release.changedFiles) assert(release.files[file], file);
  for (const [file, hash] of Object.entries(release.files)) assert.equal(sha(readFile(file)), hash, file);
  const review = JSON.parse(readFile(`${evidence}/review.json`));
  assert.equal(review.imageReviewPassed, true);
  assert.equal(review.handReviewPassed, true);
  assert.equal(review.breadImagesUsedAsDefault, false);
  const backup = JSON.parse(readFile(`${evidence}/source-drive-verification.json`));
  assert(backup.parentVerified && backup.downloadedByteIdentical && backup.zipCrcVerified);
  const manifest = JSON.parse(readFile(`${evidence}/source-manifest.json`));
  assert.equal(backup.manifestEntriesVerified, manifest.length);
  for (const row of manifest) assert.equal(row.sha256, release.files[row.path], row.path);
  return release;
}

export function readBeforeWordImageReplacements(file, release, readFile = readFileSync) {
  return release?.changedFiles.includes(file) ? Buffer.from(git('show', `${release.baselineSourceCommit}:${file}`)) : readFile(file);
}
