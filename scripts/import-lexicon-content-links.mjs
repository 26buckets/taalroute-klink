import { readFileSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
const [file, curriculumFile] = process.argv.slice(2);
assert(file && curriculumFile, 'Provide the frozen Lexicon mapping and its curriculum export.');
const parse = file => JSON.parse(readFileSync(file, 'utf8'));
const map = parse(file), sourceCurriculum = parse(curriculumFile);
const curriculum = parse('data/klink-curriculum.json'), content = parse('data/klink-connected-content.json');
assert.deepEqual(sourceCurriculum, curriculum, 'Reconcile curriculum editions before importing content links.');
assert.equal(map.release.authority, 'Lexicon');
assert.equal(map.release.curriculumEdition, curriculum.release.id);
assert.equal(map.release.curriculumInputHash, curriculum.release.inputHash);
assert.equal(new Set(map.items.map(item => item.id)).size, content.items.length);
const byId = new Map(map.items.map(item => [item.id, item]));
for (const item of content.items) {
  const canonical = byId.get(item.id); assert(canonical, item.id);
  assert.equal(canonical.textHash, createHash('sha256').update(item.text).digest('hex'), 'Recorded text differs from Lexicon: ' + item.id);
  assert(canonical.wordIds.length && canonical.wordIds.every(id => item.wordIds.includes(id)), 'An unreviewed new meaning link was added: ' + item.id);
  assert.deepEqual(canonical.readingWordIds, item.readingWordIds);
  assert.equal(canonical.independentReading, false);
}
// Klink consumes the placements, not another editable copy of Lexicon's teaching notes.
const projection = { schemaVersion: 1, release: map.release,
  exportSha256: createHash('sha256').update(readFileSync(file)).digest('hex'), policy: map.policy,
  words: map.words.map(({ wordId, firstStepId, repeatStepIds }) => ({ wordId, firstStepId, repeatStepIds })),
  steps: map.steps.map(({ id, contents }) => ({ id, contents })),
  items: map.items.map(({ id, textHash, wordIds }) => ({ id, textHash, wordIds })) };
const serialized = JSON.stringify(projection) + '\n';
if (process.argv.includes('--check')) assert.equal(readFileSync('data/klink-content-routing.json', 'utf8'), serialized);
else writeFileSync('data/klink-content-routing.json', serialized);
console.log(`${map.items.length} content records follow ${map.release.id}; curriculum and transcripts unchanged.`);
