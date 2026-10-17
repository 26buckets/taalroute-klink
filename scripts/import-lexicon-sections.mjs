import assert from 'node:assert/strict';
import {readFileSync, writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const file = process.argv[2];
assert(file, 'Provide the canonical Lexicon section export.');
const raw=readFileSync(file,'utf8'), sections=JSON.parse(raw);
const curriculum=JSON.parse(readFileSync('data/klink-curriculum.json','utf8'));
const media=JSON.parse(readFileSync('data/klink-media.json','utf8'));
assert.equal(sections.release.authority,'Lexicon');
assert.equal(sections.release.curriculumEdition,curriculum.release.id);
assert.equal(sections.release.curriculumInputHash,curriculum.release.inputHash);
assert.equal(sections.sections.length,15);
assert.deepEqual(sections.sections.flatMap(s=>s.wordIds).sort(),curriculum.words.map(w=>w.id).sort());
for(const section of sections.sections) {
  assert(section.wordIds.includes(section.cover.wordId));
  assert.equal(section.cover.image, media[section.cover.wordId].image, 'Use the existing approved word image.');
  assert.equal(createHash('sha256').update(readFileSync('public'+section.cover.image)).digest('hex'),section.cover.sha256);
}
if(process.argv.includes('--check'))assert.equal(readFileSync('data/klink-sections.json','utf8'),raw);
else writeFileSync('data/klink-sections.json',raw);
console.log('15 Lexicon sections; all 338 meanings and existing opening images verified.');
