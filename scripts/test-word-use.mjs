import {createHash} from 'node:crypto';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {wordUseBank,wordUseCollections,wordUseExercises,wordUseInstruction} from '../lib/word-use.ts';
import {availableChapterCollections,chapterHash,parseChapterHash,selectedChapterCollection} from '../lib/practice-chapters.ts';
import {groupActivities,groupExercises} from '../lib/group-practice.ts';
import {parseLearningReview,updateLearningReview} from '../lib/learning-review.ts';
import {resolveRegisteredAudio} from '../lib/audio-register.ts';
import {isInstructionAudioEnabled,isWithdrawnAudio} from '../lib/audio-policy.ts';
const read=f=>JSON.parse(readFileSync(f)),base='9b5ca8c942d45dcf0988d3b893f55a23c069cca6';
const bindings=read('data/klink-word-use-audio.json');
void test('288 authored questions: two activities, three levels and six short rounds at each level',()=>{
 assert.equal(wordUseBank.entries.length,288);assert.equal(wordUseCollections.length,36);assert.equal(new Set(wordUseBank.entries.map(e=>e.id)).size,288);
 for(const activity of ['word-combinations','suitable-reply'])for(const level of ['a1','a2','b1']){
  const collections=availableChapterCollections(activity,{level,help:'practice'});assert.equal(collections.length,6);assert.equal(collections.flatMap(c=>c.exercises).length,48);assert(collections.every(c=>c.exercises.length===8));
  assert.equal(availableChapterCollections(activity,{level,help:'guided'}).length,0);
 }
 for(const level of ['alfa-a','alfa-b','alfa-c','b2','support'])for(const activity of ['word-combinations','suitable-reply'])assert.equal(availableChapterCollections(activity,{level}).length,0);
});
void test('every card has one correct answer, exact feedback and complete registered audio',()=>{
 const review=read('docs/word-use-independent-review-20261101/content-review.json');assert.equal(review.rows.length,288);
 for(const collection of wordUseCollections)for(const e of collection.exercises){
  const row=wordUseBank.entries.find(x=>x.id===e.wordUseId),r=review.rows.find(x=>x.id===e.wordUseId);
  assert.equal(e.options.length,4);assert.equal(new Set(e.options.map(o=>o.label)).size,4);assert.equal(e.answer.correctOptionIds.length,1);
  assert.equal(e.options.find(o=>e.answer.correctOptionIds.includes(o.id)).label,row.answer);assert.equal(e.correctFeedback,row.explanation);assert.deepEqual(r.options,row.options);assert(r.allFourOptionsReviewed&&r.uniqueCorrectAnswer);assert.equal(r.independentHumanReview,false);
  assert(!e.prompt.image);assert.equal(e.wordUseContext,row.context);assert.equal(e.manualAdvance,true);assert.equal(e.requiresAudio,false);
  if(e.mode==='word-combinations'){assert.equal((row.prompt.match(/…/g)||[]).length,1);assert.equal(row.spokenPrompt,row.prompt.split('…')[0].trim());}else assert.equal(row.spokenPrompt,row.prompt);
  for(const[text,role,src]of [[row.spokenPrompt,'target',e.prompt.audio?.src],[wordUseInstruction(e.mode,row.context),'instruction',e.instructionAudio?.src],...e.options.map(o=>[o.label,'target',o.audio?.src])]){
   assert(src,text);assert(existsSync('public'+src));assert.equal(resolveRegisteredAudio(role+':'+text,text,role,undefined,bindings),src);assert(!isWithdrawnAudio(src));
   assert.equal(bindings[role+':'+text].voiceId==='h6uBOiAjLKklte8hdYio',role==='instruction');
  }
  assert(isInstructionAudioEnabled(e.instructionAudio.src));
 }
});
void test('speaker perspective and the final B1 task division stay unambiguous',()=>{
 const a=wordUseBank.entries.find(x=>x.id==='word-use:suitable-reply:b1:01:recall:02');
 assert.equal(a.prompt,'Dus jij stuurt het verslag en ik bel de klant.');assert.equal(a.answer,'Klopt het dat ik het verslag stuur en jij de klant belt?');
 const b=wordUseBank.entries.at(-1);assert.equal(b.prompt,'Jij stuurt vandaag de informatie en ik bel morgen.');assert.equal(b.answer,'Dus ik stuur vandaag de informatie en jij belt morgen, klopt dat?');
 const signature=wordUseBank.entries.find(x=>x.prompt==='een handtekening …');assert(!signature.options.includes('geven'));
});
void test('new collections keep their level, activity, IDs and answers through every route and review',()=>{
 const now=Date.now();
 for(const c of wordUseCollections){
  const activity=c.exercises[0].mode,chapter=activity==='word-combinations'?'words':'listening',location={chapter,activity,collection:c.id,level:c.level,help:'practice'};
  assert.deepEqual(parseChapterHash(chapterHash(location)),location);assert.equal(selectedChapterCollection(location)?.id,c.id);assert(groupActivities.some(a=>a.id===activity));
  for(const seed of [1,7]){
   const tasks=wordUseExercises(c.pack,activity,seed);assert.equal(tasks.length,8);assert.deepEqual(tasks,wordUseExercises(c.pack,activity,seed));
   for(const e of tasks){assert.equal(e.options.filter(o=>e.answer.correctOptionIds.includes(o.id)).length,1);assert.deepEqual(e.textBlocks.slice(1).map(b=>b.audio.src),e.options.map(o=>o.audio.src));}
  }
  assert.equal(groupExercises(c.pack,'synonyms').length,0);assert.equal(groupExercises(c.pack,'read').length,0);
  const e=c.exercises[0],state=parseLearningReview(JSON.stringify(updateLearningReview({},{exerciseId:e.exerciseId,assessment:e.assessment,reviewEligible:e.reviewEligible,correct:false,attempts:1},now)));
  const due=availableChapterCollections('learning-review',{level:c.level,help:'practice'},state,now).flatMap(x=>x.exercises);assert.equal(due.length,1);assert.equal(due[0].exerciseId,e.exerciseId);
 }
});
void test('old synonym records, bank media, original curriculum, instructions and appearance remain unchanged',()=>{
 for(const f of ['data/klink-synonyms.json','data/klink-synonym-audio.json','data/klink-curriculum.json','data/klink-media.json','data/klink-connected-content.json','data/klink-audio-policy.json','data/klink-production-instructions.json','app/learner-ui.css','app/learner-layout.css','docs/appearance-floor-20261031/floor.json'])assert.deepEqual(readPreservedAppearance(f),execFileSync('git',['show',(f==='data/klink-synonyms.json'||f.startsWith('app/')||f.startsWith('docs/appearance-floor-')?'4612b27eebe2ef45c6d806ed18df09f7e8f1e934':base)+':'+f],{maxBuffer:128e6}),f);
 for(const[level,n]of [['a1',16],['a2',59],['b1',200]])assert.equal(availableChapterCollections('synonyms',{level,help:'practice'}).flatMap(c=>c.exercises).length,n);
 const original=JSON.parse(execFileSync('git',['show',base+':data/klink-word-library-index.json'],{maxBuffer:16e6})),current=read('data/klink-word-library-index.json'),added=new Set(['word-combinations','suitable-reply']);
 assert.deepEqual({...current,chapters:current.chapters.map(c=>({...c,activities:c.activities.filter(a=>!added.has(a))})),activities:current.activities.filter(a=>!added.has(a.id))},original);
});
void test('audio resolution refuses altered transcripts, roles, missing approval and unsafe paths',()=>{
 const [id,entry]=Object.entries(bindings)[0];assert(entry);
 for(const changes of [{transcript:'anders'},{role:'wrong'},{review:'candidate'},{metadataApproved:false},{src:'/package-audio/../secret.mp3'}])assert.equal(resolveRegisteredAudio(id,entry.transcript,entry.role,undefined,{[id]:{...entry,...changes}}),undefined);
});

// Compare with the actual integrated live floor; only this exact local addition is removed.
function readPreservedAppearance(file) {
 const current=readFileSync(file);
 if(file!=='app/learner-layout.css')return current;
 const addition=readFileSync('docs/instruction-local-20261101/layout-addition.css');
 assert.equal(createHash('sha256').update(addition).digest('hex'),'f28371faa8fc19a8ac899c2daf42059b080189b91d0489185498a93c0337df07');
 assert(current.subarray(-addition.length).equals(addition));
 return current.subarray(0,current.length-addition.length);
}
