import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyWritingAnswer,parseWritingAnswer,updateWritingAnswer,writingAnswerSourceId,writingAnswerKey,preserveAvailableCopyAnswers} from '../lib/writing-answer.ts';

test('draft edits, a first incorrect submission and a later correction keep distinct user responses',()=>{
 const empty=emptyWritingAnswer(),draft=updateWritingAnswer(empty,'Mijn eigen concept');assert.equal(draft.first,undefined);assert.equal(empty.draft,'');
 const first=updateWritingAnswer(draft,'  mijn fout  ',true),revised=updateWritingAnswer(first,'huis'),final=updateWritingAnswer(revised,'HUIS',true);
 assert.deepEqual(final,{version:1,draft:'HUIS',first:'  mijn fout  ',last:'HUIS'});
 const restart={...final,draft:''};assert.deepEqual(parseWritingAnswer(JSON.stringify(restart)),{version:1,draft:'',first:'  mijn fout  ',last:'HUIS'});
 assert.deepEqual(updateWritingAnswer(empty,'  ',true),{version:1,draft:'  '});
 assert.deepEqual(parseWritingAnswer('{"version":1,"draft":"eigen concept","first":" ","last":""}'),{version:1,draft:'eigen concept'});
});
test('damaged, unknown or oversized stored records cannot become learner answers',()=>{
 for(const raw of [null,'{','null','[]','{"version":2,"draft":"word"}','{"version":1,"draft":7}','{"version":1,"draft":"word","first":{}}',JSON.stringify({version:1,draft:'x'.repeat(10001)})])assert.equal(parseWritingAnswer(raw),undefined);
 assert.deepEqual(parseWritingAnswer('{"version":1,"draft":"","model":"NOT A LEARNER RESPONSE"}'),{version:1,draft:''});
});
test('imported position drafts stay separate from canonical questions and cover the published exact-copy batches',()=>{
 const canonical={exerciseId:'original',componentId:'ALF-CMP-006',contractVersion:'1',mode:'word-dictation'};
 assert.equal(writingAnswerSourceId(canonical),undefined);
 assert.equal(writingAnswerSourceId({...canonical,writingSourceId:'KSW-AC-HT-001'}),'KSW-AC-HT-001');
 assert.equal(writingAnswerSourceId({...canonical,answerPolicy:'exact-copy'}),'original');
});
test('available old copy answers survive the rolling history without replacing existing drafts or treating models as answers',()=>{
 const memory=new Map(),storage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,v)};
 const id='KSW-AC-TN-097',old=JSON.stringify([{exerciseId:id,mode:'copy-word',assessment:'answer',answer:'mijn eerste antwoord'},{exerciseId:id,mode:'copy-word',assessment:'answer',answer:'mijn correctie'},{exerciseId:'KSW-AA-TN-006',mode:'copy-word',assessment:'answer',answer:''},{exerciseId:'canonical-word-dictation',mode:'word-dictation',assessment:'answer',answer:'huis'}]);
 memory.set('klink.taalroute.attempts.v1',old);preserveAvailableCopyAnswers(storage);
 assert.deepEqual(parseWritingAnswer(memory.get(writingAnswerKey(id))),{version:1,draft:'',first:'mijn eerste antwoord',last:'mijn correctie',firstFromAvailableHistory:true});
 assert.equal(memory.get('klink.taalroute.attempts.v1'),old);assert.equal(memory.get('klink.writing-prior-attempts.v1'),old);assert.equal(memory.size,3);
 const updated=JSON.stringify({version:1,draft:'nieuw eigen concept',first:'eerder bewaard',last:'eigen correctie'});memory.set(writingAnswerKey(id),updated);preserveAvailableCopyAnswers(storage);assert.equal(memory.get(writingAnswerKey(id)),updated);
});
