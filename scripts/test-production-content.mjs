import assert from 'node:assert/strict';
import {readFileSync,existsSync,writeFileSync,mkdirSync} from 'node:fs';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {productionIndex,validateProductionCollection} from '../lib/production-practice.ts';
import {chapterCollections,chapterHash,parseChapterHash,practiceChapters} from '../lib/practice-chapters.ts';
import {isInstructionAudioEnabled,isWithdrawnAudio} from '../lib/audio-policy.ts';
const assets=new Set(),ids=new Set(),activity={},sizes=[];
function paths(value){if(Array.isArray(value))value.forEach(paths);else if(value&&typeof value==='object')for(const [key,item] of Object.entries(value)){if(key==='src'&&typeof item==='string'){assert(item.startsWith('/'));assert(existsSync('public'+item),item);assets.add(item);}else paths(item);}}
for(const row of productionIndex){
 assert(['alfa-a','alfa-b','alfa-c','a1','a2','b1'].includes(row.level));
 assert(!ids.has(row.id));ids.add(row.id);assert(row.count>0&&row.count<=120);
 const bytes=readFileSync('public'+row.url),data=JSON.parse(bytes);
 assert(row.url.endsWith(createHash('sha256').update(bytes).digest('hex').slice(0,16)+'.json'));
 const exercises=validateProductionCollection(data,row.id,row.count);sizes.push(bytes.length);paths(exercises);
 const collection=chapterCollections(row.activity).find(c=>c.id===row.id);assert(collection);assert.equal(collection.help,row.help);
 const chapter=practiceChapters.find(c=>c.activities.includes(row.activity)).id;
 assert.equal(parseChapterHash(chapterHash({chapter,activity:row.activity,collection:row.id,level:row.level,help:row.help})).collection,row.id);
 for(const e of exercises){
  (activity[row.activity]??=new Set()).add(e.sourceExerciseId||e.exerciseId);
  assert(e.sourceDocumentId&&e.sourceStatus&&e.contentLevel===row.level);
  assert.equal(e.independentReading,false);assert.equal(e.reviewEligible,false);
  assert(isInstructionAudioEnabled(e.instructionAudio.src));assert(!isWithdrawnAudio(e.instructionAudio.src));
  if(e.requiresAudio)assert(e.prompt.audio?.src);
  if(e.mode==='copy-word'){assert(e.fields[0].acceptedAnswers.length);if(e.exampleWord)assert(e.fields[0].acceptedAnswers.includes(e.exampleWord));}
  if(e.mode==='word-build'){
   assert.equal(new Set(e.tiles.map(t=>t.id)).size,e.tiles.length);assert.equal(e.slots.length,e.tiles.length);
   assert.equal(e.answer.targetTileIds.map(id=>e.tiles.find(t=>t.id===id).token).join(''),e.helpWord);
  }
  if(e.mode==='word-bingo'){assert(e.cells.some(c=>c.cellId===e.answer.correctCellId));assert(!e.markedCellIds.includes(e.answer.correctCellId));assert.equal(new Set(e.cells.map(c=>c.text)).size,e.cells.length);}
  if(e.mode==='read-series')assert(e.textBlocks.every(b=>b.text&&b.audio?.src));
  if(e.mode==='learning-choice')for(const id of e.answer.correctOptionIds)assert.equal(e.maskedWord.replace('□',e.options.find(o=>o.id===id).label),e.helpWord);
  if(e.mode==='word-sort')assert(e.standardTask.items.every(item=>e.standardTask.categories.some(c=>c.id===item.categoryId)));
 }
}
assert.equal(productionIndex.length,1462);assert.equal(sizes.length,1462);assert.equal(ids.size,1462);
const counts=Object.fromEntries(Object.entries(activity).map(([k,v])=>[k,v.size]));
assert.deepEqual(counts,{'build-model':816,copy:8386,meet:641,memory:5,'read-series':8386,'spelling-path':698,'word-bingo':1344,'word-sort':192,worksheet:816,'worksheet-heard':840,listen:1152,'hear-match':192,read:576,match:192,cards:576,'image-bingo':2});
const old=chapterCollections('build-model').find(c=>c.id==='groep-9.alfa-a'),recall=chapterCollections('build-model').find(c=>c.id==='groep-9.alfa-b');
assert.equal(old.exercises.length,44);assert.equal(recall.exercises.length,45);assert(old.exercises.every(e=>recall.exercises.some(r=>r.exerciseId===e.exerciseId)));
assert(!isInstructionAudioEnabled('/package-audio/instructions/unknown.mp3'));
assert.throws(()=>validateProductionCollection({id:'x',exercises:[]},'x',1));
assert.throws(()=>validateProductionCollection({id:'wrong',exercises:[{}]},'x',1));
const report={collections:ids.size,exercisePlacements:productionIndex.reduce((n,r)=>n+r.count,0),uniqueSourceRecords:counts,referencedMedia:assets.size,indexBytes:readFileSync('data/klink-production-index.json').length,indexGzipBytes:gzipSync(readFileSync('data/klink-production-index.json')).length,largestCollectionBytes:Math.max(...sizes),oldAlfaAIdsPreserved:true,all45AlfaBRecallTasks:true,sourceAnswers:true,pathsExist:true,localOnly:true};
mkdirSync('docs/production-20261029',{recursive:true});writeFileSync('docs/meet-words-20261030/content-check.json',JSON.stringify(report,null,2));console.log(report);
