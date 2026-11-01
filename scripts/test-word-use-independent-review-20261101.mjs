import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const folder='docs/word-use-independent-review-20261101/',json=f=>JSON.parse(readFileSync(f));
const bank=json('data/klink-word-use.json'),changes=json(folder+'changes.json'),sha=createHash('sha256').update(readFileSync('data/klink-word-use.json')).digest('hex');
const row=id=>bank.entries.find(e=>e.id==='word-use:'+id);
void test('three independent reviews cover every question and card; changed questions have a second approval on the final source',()=>{
 for(const level of ['a1','a2','b1']){
  const review=json(folder+'independent-'+level+'.json'),final=json(folder+'final-'+level+'.json');
  assert.equal(review.reviewedCount,96);assert.equal(review.allAnswerCardsReviewed,384);assert.equal(review.independentHumanReview,false);
  assert.deepEqual(review.rows.map(r=>r.id).sort((a,b)=>a.localeCompare(b)),bank.entries.filter(e=>e.level===level).map(e=>e.id).sort((a,b)=>a.localeCompare(b)));
  assert.equal(final.sourceBankSha256,sha);assert(final.allChangedQuestionsApproved);assert.deepEqual(final.unresolved,[]);
  assert.deepEqual([...final.checkedIds].sort((a,b)=>a.localeCompare(b)),changes.filter(e=>e.level===level).map(e=>e.id).sort((a,b)=>a.localeCompare(b)));
  assert(final.rows.every(r=>r.approved&&r.uniqueCorrectAnswer&&r.naturalness&&r.levelSuitable));
 }
 assert.equal(changes.length,13);
});
void test('plausible confirmations and collocation variants are not marked as incorrect',()=>{
 for(const [id,bad] of [
  ['suitable-reply:a1:03:recall:05','Ja, het kost twee euro.'],
  ['suitable-reply:a1:04:recall:02','Ja, ik ben vijf minuten weg.'],
  ['suitable-reply:a1:04:recall:06','Ja, ik kijk morgen.'],
  ['suitable-reply:a1:05:recall:06','Ja, ik lees graag.'],
  ['suitable-reply:a1:05:recall:08','Ja, ik ben moe.'],
  ['word-combinations:a2:02:recall:08','verhuizen'],
  ['word-combinations:a2:05:recall:03','nemen'],
  ['word-combinations:b1:06:recall:04','opsteken']
 ])assert(!row(id).options.includes(bad),id);
});
void test('context selects the intended time, complete medical question and both parts of the B1 response',()=>{
 const time=row('suitable-reply:a2:01:recall:07');assert(time.context.includes('goed gehoord'));assert.equal(time.answer,'Bedoelt u drie uur vijftien?');
 const medical=row('suitable-reply:a2:06:recall:02');assert.equal(medical.prompt,'Sinds wanneer heeft u deze klachten?');assert.equal(medical.spokenPrompt,medical.prompt);
 assert(row('word-combinations:b1:02:recall:02').context.includes('verzoek om een vergunning'));
 assert(row('word-combinations:b1:03:recall:07').context.includes('waardoor'));
 const help=row('suitable-reply:b1:06:recall:06');assert(help.context.includes('bied die hulp op woensdag aan'));assert(help.answer.includes('Elke avond lukt niet. Op woensdag'));
});
