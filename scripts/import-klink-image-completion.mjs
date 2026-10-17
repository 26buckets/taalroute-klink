import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

assert(process.argv[2], 'Supply a visually reviewed image manifest.');
const read = path => JSON.parse(readFileSync(path));
const batch = read(process.argv[2]);
const media = read('data/klink-media.json');
const words = new Map(read('data/klink-curriculum.json').words.map(word => [word.id, word]));
const out = 'outputs/alfa-publicatie-20261017';
const evidence = existsSync(`${out}/image-production.json`) ? read(`${out}/image-production.json`) : [];
const sha = path => createHash('sha256').update(readFileSync(path)).digest('hex');
mkdirSync(`${out}/originals`, { recursive: true });
mkdirSync('public/package-media/completion-20261017', { recursive: true });
let linked = 0;
for (const item of batch) {
  assert(words.has(item.id), item.id);
  assert(item.source?.endsWith('.png') && existsSync(item.source), item.id);
  const hash = sha(item.source);
  const original = `${out}/originals/${item.id}-${hash.slice(0, 12)}.png`;
  copyFileSync(item.source, original);
  if (item.machineReview !== 'pass') {
    evidence.push({ ...item, original, sourceSha256: hash, linked: false });
    continue;
  }
  const image = `/package-media/completion-20261017/${item.id}.webp`;
  assert(!media[item.id].image || media[item.id].image === image, 'Do not replace an existing good image');
  execFileSync('cwebp', ['-quiet', '-resize', '760', '0', '-q', '88', original, '-o', `public${image}`]);
  media[item.id] = { ...media[item.id], image, review: 'open', imageReview: 'machine-checked-human-open' };
  evidence.push({ ...item, original, image, sourceSha256: hash, imageSha256: sha(`public${image}`), generator: 'built-in imagegen', linked: true });
  linked++;
}
writeFileSync('data/klink-media.json', JSON.stringify(media, null, 2) + '\n');
writeFileSync(`${out}/image-production.json`, JSON.stringify(evidence, null, 2));
console.log(`Linked ${linked} visually checked images; ${Object.values(media).filter(item => !item.image).length} remain.`);
