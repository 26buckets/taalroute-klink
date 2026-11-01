// Test-only reconstruction of approved revisions; no current content is written.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
export const contentRevisionCheckpoints = {
  before: 'd8883eff946af40dc0e783c412ba45fbc7deb3c9',
  approved: '834e85e7eb0ebafd0a05e7d8aa5bc33b0ab4ed27',
};
const files = new Set([
  'data/klink-imported-practice.json', 'data/klink-media.json',
  'public/content-register/active.json',
  'public/content-register/summary.json',
]);
const snapshots = new Map();
export function readBeforeLaterContentRevisions(file, read = readFileSync) {
  if (!files.has(file)) return read(file);
  if (!snapshots.has(file)) snapshots.set(file, Object.fromEntries(Object.entries(contentRevisionCheckpoints).map(([stage, commit]) =>
    [stage, execFileSync('git', ['show', `${commit}:${file}`], { maxBuffer: 128e6 })])));
  const snapshot = snapshots.get(file);
  const current = JSON.parse(read(file));
  if (file === 'data/klink-imported-practice.json') {
    // Reconstruct only Nico's exact local text correction; this grants no publication approval.
    for (const [path, hash] of [
      ['docs/local-instruction-appwide-20261101/amendment.json', 'bdcc4e401f559f675a9ebeb73534c7c2bda1cf307835061874ba1d34053ccd06'],
      ['docs/local-instruction-review-20261101/amendment.json', '9545730f58edead36ce9a8ef9e0e038367df0a19ad57799248a2d8513489b4dd'],
    ]) {
      const proof = readFileSync(path);
      assert.equal(createHash('sha256').update(proof).digest('hex'), hash);
      for (const change of JSON.parse(proof).changes.filter(change => !change.file || change.file === file)) {
        let parent = current;
        for (const key of change.path.slice(0, -1)) parent = parent[key];
        const key = change.path.at(-1);
        assert.deepEqual(parent[key], change.after, change.path.join('/'));
        parent[key] = change.before;
      }
    }
  }
  // Every other field still has to match the approved checkpoint exactly.
  assert.deepEqual(current, JSON.parse(snapshot.approved), file);
  return Buffer.from(snapshot.before);
}
