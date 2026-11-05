import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyWritingAnswer,parseWritingAnswer,updateWritingAnswer,saveWritingAnswer,writingAnswerSourceId,writingAnswerKey,preserveAvailableCopyAnswers} from '../lib/writing-answer.ts';

function writingStorage(t) {
 const memory = new Map(), queues = new Map();
 const navigatorDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
 const storageDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
 Object.defineProperty(globalThis, 'navigator', {configurable:true,value:{locks:{request(key, callback) {
  const next = (queues.get(key) ?? Promise.resolve()).then(callback);
  queues.set(key, next.catch(() => {}));
  return next;
 }}}});
 Object.defineProperty(globalThis, 'localStorage', {configurable:true,value:{getItem:key=>memory.get(key)??null,setItem:(key,value)=>memory.set(key,value)}});
 t.after(() => {
  if (navigatorDescriptor) Object.defineProperty(globalThis, 'navigator', navigatorDescriptor); else delete globalThis.navigator;
  if (storageDescriptor) Object.defineProperty(globalThis, 'localStorage', storageDescriptor); else delete globalThis.localStorage;
 });
 return memory;
}

void test('stale and simultaneous tabs retain the first submission and drafts cannot replace the last one', async t => {
 const memory=writingStorage(t),id='two-tabs',key=writingAnswerKey(id),stale=emptyWritingAnswer();
 await saveWritingAnswer(id,updateWritingAnswer(emptyWritingAnswer(),'first in A',true),true);
 await saveWritingAnswer(id,updateWritingAnswer(stale,'draft in B'));
 assert.deepEqual(JSON.parse(memory.get(key)),{version:1,draft:'draft in B',first:'first in A',last:'first in A'});
 await Promise.all([
  saveWritingAnswer(id,updateWritingAnswer(stale,'new submission',true),true),
  saveWritingAnswer(id,updateWritingAnswer(stale,'another draft')),
 ]);
 assert.deepEqual(JSON.parse(memory.get(key)),{version:1,draft:'another draft',first:'first in A',last:'new submission'});
 await saveWritingAnswer(id,{...stale,draft:''});
 assert.deepEqual(JSON.parse(memory.get(key)),{version:1,draft:'',first:'first in A',last:'new submission'});
 const emptyId='simultaneous-first';
 await Promise.all(['A','B'].map(text=>saveWritingAnswer(emptyId,updateWritingAnswer(stale,text,true),true)));
 assert.deepEqual(JSON.parse(memory.get(writingAnswerKey(emptyId))),{version:1,draft:'B',first:'A',last:'B'});
});

void test('storage failure recovers the unsaved first answer and invalid existing data is never overwritten', async t => {
 const memory=writingStorage(t),id='recovery',key=writingAnswerKey(id);
 const first=updateWritingAnswer(emptyWritingAnswer(),'unsaved first',true);
 const setItem=localStorage.setItem.bind(localStorage);
 localStorage.setItem=()=>{throw new Error('Quota');};
 await assert.rejects(saveWritingAnswer(id,first,true),/Quota/);
 localStorage.setItem=setItem;
 await saveWritingAnswer(id,updateWritingAnswer(first,'corrected',true),true);
 assert.equal(JSON.parse(memory.get(key)).first,'unsaved first');
 memory.set(key,'{damaged');
 await assert.rejects(saveWritingAnswer(id,first),/Invalid stored/);
 assert.equal(memory.get(key),'{damaged');
 await assert.rejects(saveWritingAnswer('oversized',{version:1,draft:'x'.repeat(10001)}),/Invalid writing/);
 assert(!memory.has(writingAnswerKey('oversized')));
});

void test('draft edits, a first incorrect submission and a later correction keep distinct user responses',()=>{
 const empty=emptyWritingAnswer(),draft=updateWritingAnswer(empty,'Mijn eigen concept');assert.equal(draft.first,undefined);assert.equal(empty.draft,'');
 const first=updateWritingAnswer(draft,'  mijn fout  ',true),revised=updateWritingAnswer(first,'huis'),final=updateWritingAnswer(revised,'HUIS',true);
 assert.deepEqual(final,{version:1,draft:'HUIS',first:'  mijn fout  ',last:'HUIS'});
 const restart={...final,draft:''};assert.deepEqual(parseWritingAnswer(JSON.stringify(restart)),{version:1,draft:'',first:'  mijn fout  ',last:'HUIS'});
 assert.deepEqual(updateWritingAnswer(empty,'  ',true),{version:1,draft:'  '});
 assert.deepEqual(parseWritingAnswer('{"version":1,"draft":"eigen concept","first":" ","last":""}'),{version:1,draft:'eigen concept'});
});
void test('damaged, unknown or oversized stored records cannot become learner answers',()=>{
 for(const raw of [null,'{','null','[]','{"version":2,"draft":"word"}','{"version":1,"draft":7}','{"version":1,"draft":"word","first":{}}',JSON.stringify({version:1,draft:'x'.repeat(10001)})])assert.equal(parseWritingAnswer(raw),undefined);
 assert.deepEqual(parseWritingAnswer('{"version":1,"draft":"","model":"NOT A LEARNER RESPONSE"}'),{version:1,draft:''});
});
void test('imported position drafts stay separate from canonical questions and cover the published exact-copy batches',()=>{
 const canonical={exerciseId:'original',componentId:'ALF-CMP-006',contractVersion:'1',mode:'word-dictation'};
 assert.equal(writingAnswerSourceId(canonical),undefined);
 assert.equal(writingAnswerSourceId({...canonical,writingSourceId:'KSW-AC-HT-001'}),'KSW-AC-HT-001');
 assert.equal(writingAnswerSourceId({...canonical,answerPolicy:'exact-copy'}),'original');
});
void test('available old copy answers survive the rolling history without replacing existing drafts or treating models as answers',async t=>{
 writingStorage(t);
 const memory=new Map(),storage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,v)};
 const id='KSW-AC-TN-097',old=JSON.stringify([{exerciseId:id,mode:'copy-word',assessment:'answer',answer:'mijn eerste antwoord'},{exerciseId:id,mode:'copy-word',assessment:'answer',answer:'mijn correctie'},{exerciseId:'KSW-AA-TN-006',mode:'copy-word',assessment:'answer',answer:''},{exerciseId:'canonical-word-dictation',mode:'word-dictation',assessment:'answer',answer:'huis'}]);
 memory.set('klink.taalroute.attempts.v1',old);await preserveAvailableCopyAnswers(storage);
 assert.deepEqual(parseWritingAnswer(memory.get(writingAnswerKey(id))),{version:1,draft:'',first:'mijn eerste antwoord',last:'mijn correctie',firstFromAvailableHistory:true});
 assert.equal(memory.get('klink.taalroute.attempts.v1'),old);assert.equal(memory.get('klink.writing-prior-attempts.v1'),old);assert.equal(memory.size,3);
 const updated=JSON.stringify({version:1,draft:'nieuw eigen concept',first:'eerder bewaard',last:'eigen correctie'});memory.set(writingAnswerKey(id),updated);await preserveAvailableCopyAnswers(storage);assert.equal(memory.get(writingAnswerKey(id)),updated);
});
