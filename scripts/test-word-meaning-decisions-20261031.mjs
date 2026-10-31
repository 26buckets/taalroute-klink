import test from 'node:test';import assert from 'node:assert/strict';import{readFileSync as read}from'node:fs';
import{productionIndex,wordMeaningContexts,exerciseWord}from'../lib/production-practice.ts';
import{displayedChapterCollections,selectedChapterCollection,chapterHash,parseChapterHash,practiceChapters}from'../lib/practice-chapters.ts';
import{collectionProgressId}from'../lib/round-progress.ts';
const support=JSON.parse(read('data/klink-b1-reading-support.json')),guided=JSON.parse(read('data/klink-guided-word-selections.json'));
const prior=JSON.parse(read('docs/word-meanings-review-20261031/decisions.json'));
void test('44 guided words retain all 28 previous definitions and include the 16 accepted decisions',()=>{
 assert.equal(Object.keys(support.words).length,44);assert(prior.find(r=>r.id==='b1').words.every(w=>support.words[w]?.example));
});
void test('Every guided selection partitions its source once, retains old links and shares original progress',()=>{
 for(const [id,data]of Object.entries({...support.collections,...guided})){
  const row=productionIndex.find(c=>c.id===id),selection={chapter:practiceChapters.find(c=>c.activities.includes(row.activity)).id,activity:row.activity,level:row.level,help:row.help};
  const old=selectedChapterCollection({...selection,collection:id});assert(old&&!old.readingSelection);
  const views=displayedChapterCollections(row.activity,selection).filter(c=>c.readingSelection?.sourceId===id);
  assert.deepEqual(views.flatMap(c=>(c.wordRound??c.readingSelection).exerciseIds).sort((a,b)=>a.localeCompare(b)),[...data.allExerciseIds].sort((a,b)=>a.localeCompare(b)));
  for(const c of views){assert.equal(collectionProgressId(row.activity,c.readingSelection.sourceId,c.contentUrl),collectionProgressId(row.activity,id,old.contentUrl));assert.equal(selectedChapterCollection(parseChapterHash(chapterHash({...selection,collection:c.id}))),c);if(c.wordRound)assert(c.wordRound.wordIds.length<=8);}
  for(const base of views.filter(c=>c.id.includes('~core')))assert(data.supportIds.every(id=>!(base.wordRound??base.readingSelection).exerciseIds.includes(id)));
 }
 for(const activity of ['build-model','worksheet']){
  const views=displayedChapterCollections(activity,{activity,level:'b1',help:'guided'});
  for(const c of views.filter(c=>!c.contentUrl))for(const e of c.exercises)if(exerciseWord(e)in support.words)assert(c.id.includes('~extension'),e.exerciseId);
 }
});
void test('Homonyms keep spelling answers, explicit contexts and original Alfa senses; register requires recognition only',()=>{
 const seen=new Set();let recognition=0;
 for(const row of productionIndex){for(const e of JSON.parse(read('public'+row.url)).exercises){
  const word=exerciseWord(e),contexts=wordMeaningContexts(e);
  if(['pak','want','regent','zinnen','voorkomen'].includes(word)&&['a2','b1'].includes(row.level)){
   assert.equal(contexts.length,2,word);seen.add(word);
   if(e.fields)assert(e.fields[0].acceptedAnswers.includes(word));
   if(word==='regent')assert(e.meaning.includes('wolken'));if(word==='zinnen')assert(e.meaning.includes('Groepen woorden'));
  }
  if(e.exerciseId==='TYP-B1-1454'){assert.equal(e.mode,'meaning-register');assert.equal(e.fields,undefined);assert.equal(e.helpWord,undefined);assert.equal(e.exampleWord,undefined);assert.deepEqual(e.answer.correctOptionIds,['recognition']);assert.equal(e.options.filter(x=>e.answer.correctOptionIds.includes(x.id)).length,1);assert(guided[row.id].supportIds.includes(e.exerciseId));recognition++;}
  if(row.level==='alfa-a'&&word==='want')assert(e.meaning?.includes('hand'));
 }}assert.equal(seen.size,5);assert.equal(recognition,1);
});
