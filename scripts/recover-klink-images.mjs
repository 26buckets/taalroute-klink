import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { basename, join } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

// Exact catalog bindings only; a matching spelling is not evidence for another meaning.
const root = new URL('../', import.meta.url).pathname;
const read = path => JSON.parse(readFileSync(join(root, path)));
const curriculum = read('data/klink-curriculum.json');
const media = read('data/klink-media.json');
const index = read('work/source/photo-index.json');
const archive = join(root, 'work/source/media-afronding.zip');
const candidates = new Map();
for (let n = 2; n <= 16; n++) {
  const cp = `CP${String(n).padStart(3, '0')}`;
  const fromZip = name => JSON.parse(execFileSync('unzip', ['-p', archive, `herstelgegevens/pakketten/${cp}/${name}.json`]));
  const source = fromZip('bron'), catalog = fromZip('mediacatalogus');
  source.words.forEach((row, i) => {
    const image = catalog.images[`${cp}-IMG-WORD-${String(i + 1).padStart(2, '0')}-V1`];
    if (!image?.url) return;
    const matches = index.files.filter(file => file.local_paths.some(path => basename(path) === basename(image.url)));
    const hashes = [...new Set(matches.map(file => file.sha256))];
    if (hashes.length !== 1) return;
    const file = matches[0];
    const item = { word: row[0], meaning: row[1], alt: image.altText, source: cp, sha256: file.sha256, restore: file.restore_locations[0] };
    const list = candidates.get(row[0]) || [];
    list.push(item);
    candidates.set(row[0], list);
  });
}
const plan = [], missing = [];
for (const word of curriculum.words) {
  if (media[word.id]?.image) continue;
  const options = candidates.get(word.word) || [];
  const unambiguous = new Set(options.map(item => item.sha256)).size === 1;
  if (!unambiguous || word.id === 'klink-woord-pak-verpakking') {
    missing.push({ id: word.id, word: word.word, reason: options.length ? 'meaning-or-version-review' : 'no-exact-catalog-binding' });
    continue;
  }
  plan.push({ id: word.id, ...options[0] });
}
const out = join(root, 'outputs/media-connection');
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'image-recovery-plan.json'), JSON.stringify({ plan, missing }, null, 2));
console.log(JSON.stringify({ recoverable: plan.length, unresolved: missing.length, archives: [...new Map(plan.map(item => [item.restore.drive_id, item.restore])).values()].map(({ drive_id, archive }) => ({ drive_id, archive })) }, null, 2));
if (process.argv.includes('--apply')) {
  const evidenceFile = join(out, 'image-recovery-evidence.json');
  const evidence = existsSync(evidenceFile) ? JSON.parse(readFileSync(evidenceFile)) : [];
  const targetDir = join(root, 'public/package-media/taalroute');
  mkdirSync(targetDir, { recursive: true });
  for (const item of plan) {
    const zip = join(root, 'work/source/photos', `${item.restore.drive_id}.zip`);
    assert(existsSync(zip), `Archive missing: ${item.restore.archive}`);
    const bytes = execFileSync('unzip', ['-p', zip, item.restore.entry], { maxBuffer: 20e6 });
    assert.equal(createHash('sha256').update(bytes).digest('hex'), item.sha256);
    const original = join(out, `${item.id}.png`);
    writeFileSync(original, bytes);
    const image = `/package-media/taalroute/${item.id}.webp`;
    execFileSync('cwebp', ['-quiet', '-resize', '760', '0', '-q', '85', original, '-o', join(root, 'public', image)]);
    media[item.id] = { ...media[item.id], image, review: 'open' };
    evidence.push({ ...item, image, outputSha256: createHash('sha256').update(readFileSync(join(root, 'public', image))).digest('hex'), meaningReview: 'open' });
  }
  writeFileSync(join(root, 'data/klink-media.json'), JSON.stringify(media, null, 2) + '\n');
  writeFileSync(evidenceFile, JSON.stringify(evidence, null, 2));
  console.log(`Connected ${plan.length} existing images; ${evidence.length} recorded in total. Human meaning review remains open.`);
}
