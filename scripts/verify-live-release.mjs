import { dirname } from 'node:path';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { klinkContexts } from '../lib/klink-context.ts';
const base = 'https://klink.taalroute.nl';
const output = process.argv[2] ?? 'outputs/sections-20261017/live-verification.json';
const read = path => JSON.parse(readFileSync(path));
const words = read('data/klink-curriculum.json').words;
const media = read('data/klink-media.json');
const content = read('data/klink-connected-content.json');
const instructions = read('data/klink-instructions.json');
const comprehension = read('data/klink-comprehension-audio.json');
const expected = read('public/release.json');
const releaseResponse = await fetch(base + '/release.json', { cache: 'no-store' });
assert(releaseResponse.ok);
const release = await releaseResponse.json();
assert.deepEqual(release, expected);
assert.equal(release.sourceClean, true);
const paths = [...new Set([
  ...words.flatMap(word => [media[word.id].image, media[word.id].audio]),
  ...content.items.flatMap(item => item.blocks.map(block => block.audio.src)),
  ...klinkContexts.flatMap(item => [item.audio, item.image]),
  ...instructions.items.map(item => item.src), ...comprehension.items.map(item => item.src),
].filter(Boolean))].sort();
const results = [], errors = []; let next = 0;
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
await Promise.all(Array.from({ length: 8 }, async () => {
  while (next < paths.length) {
    const path = paths[next++];
    try {
      assert(path.startsWith('/') && !path.includes('..'));
      const response = await fetch(base + path, { signal: AbortSignal.timeout(45000) });
      assert.equal(response.status, 200, path);
      const data = Buffer.from(await response.arrayBuffer());
      const hash = sha(data);
      assert.equal(hash, sha(readFileSync('public' + path)), path);
      results.push({ path, bytes: data.length, sha256: hash, contentType: response.headers.get('content-type') });
    } catch (error) { errors.push({ path, error: String(error) }); }
  }
}));
const response = await fetch(base + '/', { cache: 'no-store' });
assert.equal(response.status, 200);
const html = await response.text();
const appPaths = [...new Set(html.match(/\/_next\/static\/chunks\/page-[A-Za-z0-9_-]+\.js/g) || [])];
assert.equal(appPaths.length, 1);
const client = Buffer.from(await (await fetch(base + appPaths[0])).arrayBuffer());
assert.equal(sha(client), sha(readFileSync('dist/client' + appPaths[0])));
const record = { checkedAt: new Date().toISOString(), release, wordMeanings: words.length,
  connectedItems: content.items.length, mediaChecked: results.length, expectedMedia: paths.length,
  audioMetadataPreserved: 'Fetched bytes equal the locally ffprobe-verified branded files.',
  freshClientPath: appPaths[0], freshClientSha256: sha(client), errors,
  files: results.sort((a, b) => a.path.localeCompare(b.path)) };
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, JSON.stringify(record, null, 2) + '\n');
console.log(JSON.stringify({ sourceCommit: release.sourceCommit, mediaChecked: results.length, expectedMedia: paths.length, errors }));
assert.equal(errors.length, 0);
assert.equal(results.length, paths.length);
