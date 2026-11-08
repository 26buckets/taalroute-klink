import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync} from 'node:fs';
import {dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import ignore from 'ignore';
import {audioBundleBucket, AUDIO_BUNDLE_LIMIT} from '../lib/audio-bundle-key.ts';

// These already-public URLs remain direct audio files, including in old tabs and downloads.
export const legacyAudioSource = '99908642b4ec39b31fdeb68ce7c591271259e77e';
const folder = 'public/audio-bundles/v1';
const marker = '# Generated audio bundles: only never-published short source files may be omitted.\n';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
export function buildAudioBundles({check = false} = {}) {
  const originalIgnore = readFileSync('public/.assetsignore', 'utf8').split(marker)[0];
  const excluded = ignore().add(originalIgnore);
  const legacyIgnore = ignore().add(execFileSync('git', ['show', legacyAudioSource + ':public/.assetsignore'], {encoding: 'utf8'}));
  const legacy = new Set(execFileSync('git', ['ls-tree', '-r', '--name-only', legacyAudioSource, '--', 'public/package-audio'], {encoding: 'utf8', maxBuffer: 8e6}).trim().split('\n').map(path => path.slice(7)).filter(path => !legacyIgnore.ignores(path)));
  const groups = new Map(), files = new Map(), entries = [];
  for (const file of readdirSync('public/package-audio', {recursive: true, withFileTypes: true})) {
    if (!file.isFile()) continue;
    const path = file.parentPath + '/' + file.name, source = path.slice(6);
    if (excluded.ignores(source.slice(1)) || !/\.(mp3|wav)$/.test(source) || source.endsWith('/listen-ready.wav')) continue;
    assert(!source.includes('..') && /^\/package-audio\/[a-zA-Z0-9_./-]+$/.test(source), source);
    const bytes = readFileSync(path);
    if (bytes.length > AUDIO_BUNDLE_LIMIT) continue;
    assert(bytes.length >= 12 && (bytes.subarray(0, 3).toString() === 'ID3' || (bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WAVE')), 'Unsupported audio header: ' + source);
    const group = dirname(source);
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push({source, bytes});
  }
  function save(rows) {
    if (!rows.length) return;
    const bytes = Buffer.concat(rows.map(row => row.bytes)), hash = sha(bytes);
    assert(bytes.length <= AUDIO_BUNDLE_LIMIT);
    files.set(hash + '.bin', bytes);
    let offset = 0;
    for (const row of rows) {
      assert(bytes.subarray(offset, offset + row.bytes.length).equals(row.bytes), row.source);
      entries.push({source: row.source, hash, offset, length: row.bytes.length, sha256: sha(row.bytes)});
      offset += row.bytes.length;
    }
  }
  for (const [, rows] of [...groups].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)) {
    let batch = [], size = 0;
    for (const row of rows.sort((a, b) => a.source < b.source ? -1 : a.source > b.source ? 1 : 0)) {
      if (size + row.bytes.length > AUDIO_BUNDLE_LIMIT) { save(batch); batch = []; size = 0; }
      batch.push(row); size += row.bytes.length;
    }
    save(batch);
  }
  const indexes = Array.from({length: 128}, () => ({}));
  for (const row of entries) indexes[audioBundleBucket(row.source)][row.source] = [row.hash, row.offset, row.length];
  const roots = indexes.map(index => {
    const bytes = Buffer.from(JSON.stringify(index) + '\n');
    assert(bytes.length <= 128 * 1024, 'Audio index shard too large');
    const hash = sha(bytes); files.set(hash + '.json', bytes); return hash;
  });
  const output = (path, bytes) => {
    if (check) assert(Buffer.from(bytes).equals(readFileSync(path)), 'Outdated generated audio file: ' + path);
    else writeFileSync(path, bytes);
  };
  const retained = new Set(JSON.parse(readFileSync('data/klink-audio-retention.json')).files);
  for (const name of retained) {
    assert(/^[a-f0-9]{64}\.(bin|json)$/.test(name), 'Invalid retained audio path');
    const bytes = files.get(name) ?? readFileSync(folder + '/' + name);
    assert.equal(sha(bytes), name.split('.')[0], 'Restore retained audio from the verified backup: ' + name);
  }
  mkdirSync(folder, {recursive: true});
  for (const [name, bytes] of files) output(folder + '/' + name, bytes);
  for (const name of readdirSync(folder)) if (!files.has(name) && !retained.has(name)) {
    assert(/^[a-f0-9]{64}\.(bin|json)$/.test(name), 'Unexpected generated audio file');
    assert(!check, 'Obsolete audio bundle'); unlinkSync(folder + '/' + name);
  }
  const unpublished = entries.filter(row => !legacy.has(row.source.slice(1))).map(row => row.source);
  output('data/klink-audio-bundle-index.json', JSON.stringify({indexes: roots, bundledOnly: unpublished}) + '\n');
  output('public/.assetsignore', originalIgnore + marker + (unpublished.length ? unpublished.join('\n') + '\n' : ''));
  const manifest = {legacyAudioSource, maxBundleBytes: AUDIO_BUNDLE_LIMIT, legacyAssets: legacy.size, recordings: entries.length, bundles: [...files.keys()].filter(name => name.endsWith('.bin')).length, indexFiles: roots.length, retainedOnlyFiles: [...retained].filter(name => !files.has(name)), newSourceFilesOmitted: unpublished, entries};
  if (!check) { mkdirSync('outputs/audio-bundles', {recursive: true}); writeFileSync('outputs/audio-bundles/manifest.json', JSON.stringify(manifest, null, 2) + '\n'); }
  return manifest;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const {recordings, bundles, indexFiles, newSourceFilesOmitted} = buildAudioBundles({check: process.argv.includes('--check')});
  console.log(JSON.stringify({recordings, bundles, indexFiles, newSourceFilesOmitted: newSourceFilesOmitted.length}));
}
