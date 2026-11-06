import assert from 'node:assert/strict';
import {readFileSync, mkdirSync, writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

const base = process.env.KLINK_TEST_BASE || 'http://127.0.0.1:19135';
const before = process.env.KLINK_BASELINE_BASE || 'http://127.0.0.1:19134';
for (const url of [base, before]) assert(['127.0.0.1', 'localhost'].includes(new URL(url).hostname), 'Local testing only');
const out = process.env.KLINK_TEST_OUTPUT || 'outputs/static-audio-local/http'; mkdirSync(out, {recursive: true});
const {manifest} = JSON.parse(readFileSync('outputs/static-audio-local/manifest.json'));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const checks = [], errors = []; let next = 0;
await Promise.all(Array.from({length: 8}, async () => {
  while (next < manifest.length) {
    const item = manifest[next++];
    try {
      const response = await fetch(base + item.path, {headers: {'Accept-Encoding': 'identity'}, signal: AbortSignal.timeout(15000)});
      assert.equal(response.status, 200, item.path);
      const bytes = Buffer.from(await response.arrayBuffer());
      assert.equal(bytes.length, item.bytes); assert.equal(hash(bytes), item.sha256);
      checks.push(item.path);
      if (checks.length % 3000 === 0) console.log('Verified', checks.length);
    } catch (error) { errors.push({path: item.path, message: error.message}); }
  }
}));
writeFileSync(out + '/files.json', JSON.stringify({expected: manifest.length, exactBytes: checks.length, errors}, null, 2));
assert.deepEqual(errors, []);
const audio = manifest.filter(item => item.part === 'audio');
const samples = ['.mp3', '.wav', '.m4a', '.bin'].map(extension => audio.find(item => item.path.endsWith(extension)));
samples.push([...audio].sort((a, b) => b.bytes - a.bytes)[0]);
const contracts = [];
for (const item of samples) for (const mode of ['HEAD', 'range', 'suffix', 'query', 'cached']) {
  const responses = [];
  for (const origin of [before, base]) {
    const headers = {'Accept-Encoding': 'identity'};
    if (mode === 'range') headers.Range = 'bytes=0-31';
    if (mode === 'suffix') headers.Range = 'bytes=-32';
    if (mode === 'cached') { const head = await fetch(origin + item.path, {method: 'HEAD'}); headers['If-None-Match'] = head.headers.get('ETag'); }
    const response = await fetch(origin + item.path + (mode === 'query' ? '?v=preserved' : ''), {method: mode === 'HEAD' ? 'HEAD' : 'GET', headers, signal: AbortSignal.timeout(15000)});
    const body = Buffer.from(await response.arrayBuffer());
    assert(response.headers.get('etag'), 'ETag must be present');
    if (mode === 'cached') assert.equal(response.status, 304);
    responses.push({status: response.status, sha256: hash(body), headers: Object.fromEntries(['content-type', 'content-length', 'cache-control', 'content-range', 'accept-ranges'].map(key => [key, response.headers.get(key)]))});
  }
  assert.deepEqual(responses[1], responses[0], item.path + ' ' + mode); contracts.push({path: item.path, mode, ...responses[1]});
}
const blocked = ['/package-audio/not-a-real-file.mp3', '/package-audio/instructions/KLINK-INS-test.mp3'];
// The source ignore list is authoritative; include every existing withdrawn file in this directory.
const {assetPaths} = await import('./check-asset-limit.mjs');
const published = new Set(assetPaths('public'));
const {readdirSync} = await import('node:fs');
for (const file of readdirSync('public/package-audio', {recursive: true, withFileTypes: true})) if (file.isFile()) {
  const path = file.parentPath + '/' + file.name;
  if (!published.has(path.slice('public/'.length))) blocked.push('/' + path.slice('public/'.length));
}
for (const path of blocked) { const response = await fetch(base + path); assert.equal(response.status, 404, path); await response.arrayBuffer(); }
const summary = {expected: manifest.length, exactBytes: checks.length, audio: audio.length, errors, contracts, blocked404: blocked.length};
writeFileSync(out + '/result.json', JSON.stringify(summary, null, 2) + '\n');
assert.deepEqual(errors, []); assert.equal(checks.length, manifest.length);
console.log('PASS', checks.length, 'exact HTTP files;', contracts.length, 'unchanged HTTP contracts;', blocked.length, 'excluded/unknown paths remain 404.');
