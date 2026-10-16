// Copy only the reviewed candidates, preserving the original SVG bytes.
import { readFileSync, copyFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const reviewFile = process.argv[2] || 'outputs/media-completion-20261016/symbol-review.json';
const review = JSON.parse(readFileSync(reviewFile));
const media = JSON.parse(readFileSync('data/klink-media.json'));
const selected = review.filter(item => item.decision === 'linked-for-review');
const expected = ['acht', 'blauw', 'bruin', 'cirkel', 'geel', 'negen', 'rood', 'vijf', 'zes', 'zeven'];
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
assert.deepEqual(selected.map(item => item.word).sort(), expected);
mkdirSync('public/package-media/taalroute', { recursive: true });
for (const item of selected) {
  const path = `/package-media/taalroute/${item.id}.svg`;
  assert.equal(media[item.id].image, path);
  assert.equal(item.humanApproval, 'open');
  assert.equal(media[item.id].review, 'open');
  const source = readFileSync(item.source);
  assert.equal(sha(source), item.sha256, item.id);
  assert(!/<script|<foreignObject|(?:href|src)\s*=\s*["']https?:/i.test(source.toString()));
  copyFileSync(item.source, `public${path}`);
  const delivered = readFileSync(`public${path}`);
  assert(source.equals(delivered), item.id);
  item.output = path;
  item.outputSha256 = sha(delivered);
}
writeFileSync(reviewFile, JSON.stringify(review, null, 2));
console.log(`${selected.length} original SVGs copied and byte-checked; human review remains open.`);
