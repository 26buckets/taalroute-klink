import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { contentPackages } from '../lib/package-content.ts';
import { extendedActivities, extendedExercises } from '../lib/extended-practice.ts';

// This release-specific fixture was captured from untouched main b085d626.
const baseline = JSON.parse(readFileSync('docs/network-peaks-20261104/extended-before.json'));
const rows = [];
for (const pack of contentPackages) for (const activity of extendedActivities) for (const seed of [1, 7]) {
  const items = extendedExercises(pack, activity.id, seed);
  rows.push({ pack: pack.id, activity: activity.id, seed, count: items.length, sha256: createHash('sha256').update(JSON.stringify(items)).digest('hex') });
}
assert.deepEqual(rows, baseline, 'Preserve ordering, duplicates, IDs, answers, audio, source lessons and reading conditions');
for (const activity of extendedActivities) assert.deepEqual(extendedExercises({ ...contentPackages[0], exercises: [], words: [], lessons: [] }, activity.id), []);
console.log(`PASS ${rows.length} exact baseline comparisons and ${extendedActivities.length} empty-pack checks`);
