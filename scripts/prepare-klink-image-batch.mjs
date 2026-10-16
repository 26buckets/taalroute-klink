import { readFileSync, mkdirSync, copyFileSync, writeFileSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const plan = JSON.parse(readFileSync('docs/klink-beeldbatch-20261016.json'));
const words = JSON.parse(readFileSync('data/klink-curriculum.json')).words;
const out = 'outputs/media-review-20261016';
const sha = file => createHash('sha256').update(readFileSync(file)).digest('hex');
mkdirSync(`${out}/originals`, { recursive: true });
mkdirSync(`${out}/rejected`, { recursive: true });
mkdirSync('public/package-media/candidates', { recursive: true });
const evidence = [];
for (const item of plan.items) {
  assert(words.some(word => word.id === item.id), item.id);
  assert.equal(item.humanReview, 'open');
  assert.equal(item.image, `/package-media/candidates/${item.id}.webp`);
  const original = `${out}/${item.original}`;
  copyFileSync(item.sourceImage, original);
  assert.equal(sha(original), sha(item.sourceImage));
  execFileSync('cwebp', ['-quiet', '-resize', '760', '0', '-q', '88', original, '-o', `public${item.image}`]);
  evidence.push({ id: item.id, original: item.original, sourceSha256: sha(original), image: item.image, imageSha256: sha(`public${item.image}`), originalBytes: statSync(original).size, humanReview: 'open' });
}
for (const item of plan.rejected) copyFileSync(item.sourceImage, `${out}/rejected/${item.id}.png`);
writeFileSync(`${out}/image-evidence.json`, JSON.stringify({ humanReview: 'open', items: evidence }, null, 2));
console.log(`Prepared ${evidence.length} image candidates; originals ${(evidence.reduce((sum, item) => sum + item.originalBytes, 0) / 1e6).toFixed(1)} MB. No approval or publication performed.`);
