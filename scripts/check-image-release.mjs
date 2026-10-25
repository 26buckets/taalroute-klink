import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const digest = value => createHash('sha256').update(value).digest('hex');
const read = path => JSON.parse(readFileSync(path));
export function assertImageMappings(before, after, images) {
  const expected = structuredClone(before), ids = new Set();
  for (const image of images) for (const id of image.ids) {
    assert(!ids.has(id), `Duplicate image target ${id}`); ids.add(id);
    expected[id] = { ...(expected[id] ?? { review: 'open' }), image: image.image };
  }
  assert.deepEqual(after, expected, 'Only the reviewed image connections may change');
  return ids.size;
}

export function verifyImageRelease(successor) {
  if (successor) assert.equal(successor.baselineSourceCommit, "b850233c4445a6974728051fcfb73673f75bfcec");
  const release = read('docs/klink-owner-release-images-20261025.json');
  assert.equal(release.approvedBy, 'Nico'); assert.equal(release.publicationApproved, true);
  assert.equal(release.userRequest, 'Zet de 225 goedgekeurde afbeeldingen ook meteen online in de Klink-app en ga verder met de rest. Houd het Codex Work-verbruik zo laag mogelijk.');
  assert.equal(release.baselineSourceCommit, 'dac55cccb475b6d2ef2c18187fa56173bd3606aa');
  assert.equal(release.previousAuthorization, 'docs/klink-owner-release-groep8-20261025.json');
  const git = (...args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  git('merge-base', '--is-ancestor', release.baselineSourceCommit, 'HEAD');
  assert.equal(digest(readFileSync(release.previousAuthorization)), release.previousAuthorizationSha256);
  assert.equal(digest(git('show', `${release.baselineSourceCommit}:${release.previousAuthorization}`)), release.previousAuthorizationSha256);
  const images = read('docs/klink-images-20261025/images.json');
  assert.equal(images.length, 225); assert.equal(new Set(images.map(row => row.code)).size, 225);
  for (const row of images) {
    assert.match(row.image, /^\/package-media\/artsmart-20261025\/k\d{3}\.webp$/);
    assert.equal(row.pixelIdentical, true); assert(row.originalDriveId && /^[a-f0-9]{64}$/.test(row.originalSha256));
    assert.equal(digest(readFileSync(`public${row.image}`)), row.sha256);
    assert.equal(release.files[`public${row.image}`], row.sha256);
  }
  const before = JSON.parse(git('show', `${release.baselineSourceCommit}:data/klink-media.json`));
  assert.equal(assertImageMappings(before, read('data/klink-media.json'), images), 227);
  for (const [file, sha] of Object.entries(release.files)) {
    const actual = digest(readFileSync(file));
    if (actual !== sha) {
      assert(successor?.changedFiles.includes(file), file);
      assert.equal(successor.files[file], actual, file);
      assert.equal(digest(git('show', `${successor.baselineSourceCommit}:${file}`)), sha, file);
    }
  }
  const expected = ['data/klink-media.json', 'lib/package-content.ts', ...images.map(row => `public${row.image}`)].sort((a, b) => a.localeCompare(b));
  const actual = git('diff', '--name-only', release.baselineSourceCommit, successor?.baselineSourceCommit ?? 'HEAD', '--', 'app', 'components', 'hooks', 'data', 'lib', 'public').trim().split('\n').filter(Boolean).sort((a, b) => a.localeCompare(b));
  assert.deepEqual(actual, expected, 'No unrelated runtime change may enter the image release');
  return release;
}
