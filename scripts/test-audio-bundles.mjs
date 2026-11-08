import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, writeFileSync, mkdirSync, rmSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {buildAudioBundles} from './build-audio-bundles.mjs';
import {assetPaths} from './check-asset-limit.mjs';

void test('Every bundled recording retains all sound bytes and metadata; unpublished clips alone may leave the loose asset set', () => {
  const baseline = buildAudioBundles({check: true});
  const cache = new Map();
  for (const row of baseline.entries) {
    if (!cache.has(row.hash)) cache.set(row.hash, readFileSync('public/audio-bundles/v1/' + row.hash + '.bin'));
    const actual = cache.get(row.hash).subarray(row.offset, row.offset + row.length);
    assert(actual.equals(readFileSync('public' + row.source)), row.source);
    assert.equal(createHash('sha256').update(actual).digest('hex'), row.sha256);
  }
  assert.equal(baseline.newSourceFilesOmitted.length, 0);
  const originals = assetPaths('public').filter(path => path.startsWith('package-audio/'));
  assert.equal(originals.length, 13831);
  const folder = 'public/package-audio/bundle-local-selftest';
  mkdirSync(folder, {recursive: true});
  try {
    const bytes = readFileSync('public' + baseline.entries[0].source);
    writeFileSync(folder + '/new.mp3', bytes);
    const result = buildAudioBundles();
    assert(result.retainedOnlyFiles.length > 0, 'Old index URLs survive new audio registration');
    for (const name of result.retainedOnlyFiles) assert.equal(createHash('sha256').update(readFileSync('public/audio-bundles/v1/' + name)).digest('hex'), name.split('.')[0]);
    assert.deepEqual(result.newSourceFilesOmitted, ['/package-audio/bundle-local-selftest/new.mp3']);
    assert.deepEqual(JSON.parse(readFileSync('data/klink-audio-bundle-index.json')).bundledOnly, result.newSourceFilesOmitted);
    const next = result.entries.find(row => row.source.endsWith('/bundle-local-selftest/new.mp3'));
    assert(readFileSync('public/audio-bundles/v1/' + next.hash + '.bin').subarray(next.offset, next.offset + next.length).equals(bytes));
    assert.deepEqual(assetPaths('public').filter(path => path.startsWith('package-audio/')), originals);
    buildAudioBundles({check: true});
    execFileSync(process.execPath, ['scripts/build-practice-bundles.mjs', '--check']);
  } finally { rmSync(folder, {recursive: true, force: true}); buildAudioBundles(); }
});
