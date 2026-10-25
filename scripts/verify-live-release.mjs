import { dirname } from 'node:path';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { klinkContexts } from '../lib/klink-context.ts';
import { isWithdrawnAudio } from '../lib/audio-policy.ts';
import dialogueRepair from '../data/klink-dialogue-repair.json' with {type:'json'};
import { soundCards } from '../lib/sounds.ts';
import { allPackageWords } from '../lib/package-content.ts';
const base = 'https://klink.taalroute.nl';
const output = process.argv[2] ?? 'outputs/sections-20261017/live-verification.json';
const read = path => JSON.parse(readFileSync(path));
const words = read('data/klink-curriculum.json').words;
const media = read('data/klink-media.json');
const content = read('data/klink-connected-content.json');
const instructions = read('data/klink-instructions.json');
const comprehension = read('data/klink-comprehension-audio.json');
const sectionPhotos = read('data/klink-section-photos.json');
const expected = read('public/release.json');
const releaseResponse = await fetch(base + '/release.json', { cache: 'no-store' });
assert(releaseResponse.ok);
const release = await releaseResponse.json();
assert.deepEqual(release, expected);
assert.equal(release.sourceClean, true);
const paths = [...new Set([
  ...allPackageWords.map(word => word.audio),
  ...soundCards.map(sound => sound.audio),
  ...dialogueRepair.dialogues.flatMap(d => [d.image.src, ...d.turns.map(t => t.src)]),
  ...Object.values(sectionPhotos), ...Object.values(media).map(item => item.image),
  ...words.flatMap(word => [media[word.id].image, media[word.id].audio]),
  ...content.items.flatMap(item => item.blocks.map(block => block.audio.src)),
  ...klinkContexts.flatMap(item => [item.audio, item.image]),
  ...instructions.items.map(item => item.src), ...comprehension.items.map(item => item.src),
].filter(path => path && !isWithdrawnAudio(path)))].sort((a,b)=>a.localeCompare(b));
const results = [], errors = []; let next = 0;
const withdrawn = readdirSync('public', { recursive: true }).map(path => `/${path}`).filter(path => isWithdrawnAudio(path) && statSync(`public${path}`).isFile());
assert(withdrawn.length > 16);
for (const path of new Set(withdrawn)) {
  const response = await fetch(base + path, { cache: 'no-store' });
  assert(!/audio|octet-stream/.test(response.headers.get('content-type') || ''), `Withdrawn recording remains public: ${path}`);
}
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
  withdrawnInstructionFiles: withdrawn.length,
  connectedItems: content.items.length, mediaChecked: results.length, expectedMedia: paths.length,
  audioMetadataPreserved: 'Fetched bytes equal the locally ffprobe-verified branded files.',
  freshClientPath: appPaths[0], freshClientSha256: sha(client), errors,
  files: results.sort((a, b) => a.path.localeCompare(b.path)) };
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, JSON.stringify(record, null, 2) + '\n');
console.log(JSON.stringify({ sourceCommit: release.sourceCommit, mediaChecked: results.length, expectedMedia: paths.length, errors }));
assert.equal(errors.length, 0);
assert.equal(results.length, paths.length);
