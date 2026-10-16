import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';

const root = resolve(import.meta.dirname, '..');
const source = resolve(process.argv[2] ?? `${root}/work/lexicon-klink/data/releases/klink-leerlijn-20261016-v1.json`);
const data = JSON.parse(readFileSync(source, 'utf8'));
const ids = new Set(data.words.map(word => word.id));
assert.equal(ids.size, data.counts.meanings);
assert.equal(new Set(data.words.map(word => word.word)).size, data.counts.wordForms);
assert.equal(data.steps.filter(step => step.kind === 'klanklijst').length, data.counts.readingSteps);
for (const step of [...data.steps, ...data.extensions]) {
  for (const id of [...step.known, ...step.newWords, ...step.returning]) assert(ids.has(id), id);
}
for (const word of data.words) assert(word.firstReading && word.preparation, word.id);
mkdirSync(`${root}/data`, { recursive: true });
writeFileSync(`${root}/data/klink-curriculum.json`, JSON.stringify(data, null, 2) + '\n');
console.log(`Lexicon-editie ${data.release.id}: ${ids.size} betekenissen, ${data.steps.length} basisonderdelen.`);
