import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { contentPackages } from '../lib/package-content.ts';
import { groupExercises } from '../lib/group-practice.ts';
import { chapterCollections, practiceChapters } from '../lib/practice-chapters.ts';
import { importedCollections, importedActivities } from '../lib/imported-practice.ts';

const fixture = process.env.KLINK_CONTENT_FIXTURE || 'docs/browser-opening-wait-20261105/content-before.json';
const rows = [];
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const packHashes = new WeakMap();
const hashCollections = items => {
  const digest = createHash('sha256');
  for (const item of items) {
    if (!packHashes.has(item.pack)) packHashes.set(item.pack, hash(item.pack));
    digest.update(JSON.stringify({ ...item, pack: packHashes.get(item.pack) }));
  }
  return digest.digest('hex');
};
for (const pack of contentPackages) for (const seed of [1, 7]) {
  const exercises = groupExercises(pack, 'find-sentence', seed);
  rows.push({ pack: pack.id, seed, count: exercises.length, sha256: hash(exercises) });
}
for (const activity of new Set(practiceChapters.flatMap(chapter => chapter.activities))) {
  rows.push({ activity, sha256: hashCollections(chapterCollections(activity)) });
}
for (const { id } of importedActivities) {
  rows.push({ importedActivity: id, sha256: hashCollections(importedCollections(id, undefined, contentPackages)) });
}
if (process.argv.includes('--capture')) {
  const baseline = process.env.KLINK_CONTENT_BASELINE || '9589290d6975463bffc676e019e9834ced59ca04';
  assert(/^[a-f0-9]{40}$/.test(baseline), 'Explicit reviewed baseline required');
  assert.equal(execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), baseline);
  assert.equal(execFileSync('git', ['diff', '--name-only', '--', 'lib'], { encoding: 'utf8' }), '');
  writeFileSync(fixture, JSON.stringify(rows, null, 2) + '\n');
} else assert.deepEqual(rows, JSON.parse(readFileSync(fixture)), 'Preserve every collection, ordering, task, answer, audio and source link');
console.log(`PASS ${rows.length} complete exercise/collection checks`);
