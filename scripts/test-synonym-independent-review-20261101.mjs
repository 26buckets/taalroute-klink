import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {synonymBank,synonymCollections,synonymExercises} from '../lib/synonyms.ts';
import {parseLearningReview,updateLearningReview} from '../lib/learning-review.ts';
import {availableChapterCollections} from '../lib/practice-chapters.ts';
import {verifyIndependentSynonymReview} from './check-synonym-independent-review-20261101.mjs';
const folder='docs/synonym-independent-review-20261101/',json=f=>JSON.parse(readFileSync(f)),changes=json(folder+'changes.json'),review=json(folder+'content-review.json');
const sha=b=>createHash('sha256').update(b).digest('hex'),hash=sha(readFileSync('data/klink-synonyms.json'));
void test('225 pairs and 900 options have three blind independent reviews and final approval for all 86 changes',()=>{
 for(const[level,count,amended]of[['a1',17,9],['a2',45,27],['b1',163,50]]){
  const first=json(folder+'independent-'+level+'.json'),final=json(folder+'final-'+level+'.json');assert.equal(first.sourceBankSha256,json(folder+'baseline.json').bankSha256);assert.equal(first.results.length,count);assert.deepEqual(new Set(first.reviewedIds),new Set(synonymBank.entries.filter(e=>e.minimumLevel===level).map(e=>e.id)));assert.equal(final.sourceBankSha256,hash);assert.equal(final.rows.length,amended);assert(final.allChangedQuestionsApproved);assert.deepEqual(final.unresolved,[]);assert.equal(final.independentHumanReview,false);assert.deepEqual(new Set(final.checkedIds),new Set(changes.filter(e=>e.level===level).map(e=>e.id)));
 }
 assert.equal(review.bankSha256,hash);assert.equal(review.rows.length,225);assert.equal(review.answerCardsReviewed,900);assert.equal(review.finalContextsReviewed,188);assert.equal(review.independentHumanReview,false);
});
void test('only reviewed context fields change; all words, answers, levels, source IDs and inactive decisions remain intact',()=>{
 const before=JSON.parse(execFileSync('git',['show',json(folder+'baseline.json').sourceCommit+':data/klink-synonyms.json']));assert.equal(changes.length,86);
 for(const[i,e]of synonymBank.entries.entries()){
  const old=before.entries[i],a={...e},b={...old};for(const k of['context','reverseContext']){delete a[k];delete b[k];}assert.deepEqual(a,b);assert.equal(e.options.indexOf(e.synonym),old.options.indexOf(old.synonym));
  if(e.context){assert(e.context.includes(e.word));assert(e.reverseContext.includes(e.synonym));assert(e.context.split(/\s+/).length<=18&&e.reverseContext.split(/\s+/).length<=18);}if(JSON.stringify(e)!==JSON.stringify(old))assert(changes.some(c=>c.id===e.id));
 }
 assert.equal(synonymBank.entries.filter(e=>e.active).length,200);assert.equal(synonymBank.entries.filter(e=>!e.active).length,25);
 const get=w=>synonymBank.entries.find(e=>e.active&&e.word===w);assert(get('einde').reverseContext.includes('verhaal'));assert(get('beroep').reverseContext.includes('kapper'));assert(get('kaartje').context.includes('trein'));assert(get('voorkomen').context.includes('binnenkomt'));assert(get('overeenkomst').context.includes('ondertekenen'));assert(get('uitsluitend').reverseContext.includes('personeel'));
});
void test('all 200 questions work in both directions and three modes, retain one answer, hide listened words and preserve repetition',()=>{
 let cases=0;for(const c of synonymCollections)for(const reverse of[false,true])for(const mode of['synonyms','cards','hear-match'])for(const seed of[1,2]){
  const es=synonymExercises(c.pack,mode,seed,reverse);assert.equal(es.length,c.exercises.length);assert.deepEqual(es,synonymExercises(c.pack,mode,seed,reverse));
  for(const e of es){const row=synonymBank.entries.find(r=>r.id===e.synonymPairId),target=reverse?row.synonym:row.word,answer=reverse?row.word:row.synonym;assert(!e.prompt?.image);if(mode==='cards'){assert.equal(e.cards[0].front.text,target);assert.equal(e.cards[0].back.text,answer);assert.equal(e.reviewEligible,false);}else{assert.equal(e.options.length,4);assert.equal(new Set(e.options.map(o=>o.label)).size,4);assert.equal(e.answer.correctOptionIds.length,1);assert.equal(e.options.find(o=>e.answer.correctOptionIds.includes(o.id)).label,answer);if(mode==='hear-match'){assert(e.prompt.audio);assert.equal(e.prompt.text,undefined);if(row.context){const context=reverse?row.reverseContext:row.context;assert.equal(e.synonymContext,context.replace(target,'…'));assert(!e.synonymContext.includes(target));}}}cases++;}
 }
 assert.equal(cases,2400);const c=synonymCollections.find(c=>c.level==='a1'),now=1_800_000_000_000;
 for(const reverse of[false,true])for(const mode of['synonyms','hear-match','cards']){const e=synonymExercises(c.pack,mode,1,reverse)[0],state=parseLearningReview(JSON.stringify(updateLearningReview({},{exerciseId:e.exerciseId,correct:false,assessment:e.assessment,reviewEligible:e.reviewEligible},now))),due=availableChapterCollections('learning-review',{level:'a1',help:'practice'},state,now).flatMap(c=>c.exercises);assert.equal(due.length,mode==='cards'?0:1);if(due.length)assert.deepEqual(due[0],e);}
});
void test('publication rejects missing owner approval, stale or incomplete reviews, altered audio and unverified backup',()=>{
 assert(verifyIndependentSynonymReview());const owner='docs/klink-owner-release-synonym-independent-review-20261101.json';
 for(const[file,mutate]of[[owner,x=>x.publicationApproved=false],[folder+'backup.json',x=>x.fullReadback=false],[folder+'final-a1.json',x=>x.sourceBankSha256='0'.repeat(64)],[folder+'content-review.json',x=>x.rows[0].uniqueCorrectAnswer=false],[folder+'spelling-check.json',x=>x.unresolved=['fout']]]){
  const r=json(owner),x=json(file);mutate(x);const bytes=Buffer.from(JSON.stringify(x));if(r.evidenceFiles[file])r.evidenceFiles[file]=sha(bytes);assert.throws(()=>verifyIndependentSynonymReview(f=>f===file?bytes:f===owner?Buffer.from(JSON.stringify(r)):readFileSync(f)),file);
 }
 const clip=json(folder+'audio-inventory.json')[0];assert.throws(()=>verifyIndependentSynonymReview(f=>f==='public'+clip.src?Buffer.from('altered'):readFileSync(f)));
});
