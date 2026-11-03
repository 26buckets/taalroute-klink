import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {availableChapterCollections} from '../lib/practice-chapters.ts';
import {writingAnswerSourceId} from '../lib/writing-answer.ts';
import {exactCopyAnswer,copyDifferenceFeedback} from '../lib/copy-answer.ts';
const m=JSON.parse(readFileSync('docs/klink10-copy-ac-20261103/manifest.json'));
const bank=JSON.parse(readFileSync('public'+m.row.url)),old=JSON.parse(readFileSync('public'+m.oldRow.url));
assert(availableChapterCollections('copy',{chapter:'writing',level:'alfa-c',help:'practice'}).some(r=>r.id===m.row.id));
assert(availableChapterCollections('copy',{chapter:'writing',level:'alfa-c',help:'guided'}).some(r=>r.id===m.oldRow.id));
assert.deepEqual(bank.exercises,old.exercises.slice(0,10).map(e=>({...e,access:'supported-practice'})));
for(const [i,e] of bank.exercises.entries()){
 assert.equal(writingAnswerSourceId(e),writingAnswerSourceId(old.exercises[i]));
 assert(exactCopyAnswer(e.exampleWord,' '+e.exampleWord+' '));
 assert(!exactCopyAnswer(e.exampleWord,e.exampleWord.toUpperCase()));
 assert(copyDifferenceFeedback(e.exampleWord,e.exampleWord.toUpperCase(),e.feedback).startsWith('Kijk bij teken'));
}
console.log('Both menu entries, exact-copy criteria and ten shared canonical storage IDs verified.');
