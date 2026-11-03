import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {exactCopyAnswer} from '../lib/copy-answer.ts';
import {validateProductionCollection} from '../lib/production-practice.ts';
import {emptyWritingAnswer,updateWritingAnswer,parseWritingAnswer} from '../lib/writing-answer.ts';
const m=JSON.parse(readFileSync('docs/klink10-letter-aa-20261103/manifest.json'));
const bank=JSON.parse(readFileSync('public'+m.row.url));
const exercises=validateProductionCollection(bank,m.row.id,10);
assert.equal(createHash('sha256').update(readFileSync('public'+m.row.url)).digest('hex'),m.bankSha256);
assert.equal(exercises.map(e=>e.exampleWord).join(''),'masotnreik');
for(const [i,e] of exercises.entries()){
 const target=m.positions[i].model;
 assert.equal(e.exerciseId,m.positions[i].sourceId);assert.equal(e.title,m.positions[i].instruction);
 assert.equal(e.writingSourceId,e.exerciseId);assert.equal(e.exampleWord,target);
 assert.equal(e.answerPolicy,'exact-copy');assert.equal(e.groupActivity,'write-letter');
 assert.equal(e.instructionAudio.src,m.instruction.src);assert.equal(e.assessment,'answer');
 assert(!e.reviewEligible&&!e.independentReading&&e.manualAdvance);
 for(const wrong of [target.toUpperCase(),target+target,'z','',target+'!'])assert(!exactCopyAnswer(target,wrong));
 assert(exactCopyAnswer(target,target));assert(exactCopyAnswer(target,' '+target+' '));
 let saved=updateWritingAnswer(emptyWritingAnswer(),target.toUpperCase(),true);
 saved=updateWritingAnswer(saved,target,true);assert.equal(saved.first,target.toUpperCase());assert.equal(saved.last,target);
 assert.deepEqual(parseWritingAnswer(JSON.stringify(saved)),saved);
}
for(const p of ['lib/copy-answer.ts','lib/writing-answer.ts','lib/group-practice.ts','components/product/package-exercise-browser.tsx'])assert(readFileSync(p).equals(execFileSync('git',['show',m.baselineSourceCommit+':'+p])));
console.log('Ten source-bound lowercase-letter tasks: exact-case, multiple-character rejection, first-answer retention and unchanged players passed.');
