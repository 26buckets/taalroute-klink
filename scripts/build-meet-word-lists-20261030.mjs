import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const path='data/klink-production-index.json',index=JSON.parse(readFileSync(path));
const sources=index.filter(r=>r.activity==='cards'&&r.id.startsWith('beta-images:'));
assert.equal(sources.length,48);
const added=sources.map(row=>{
 const id=row.id.replace('beta-images:cards:','word-meet:'),source=JSON.parse(readFileSync('public'+row.url));
 assert.equal(source.exercises.length,12);assert.equal(new Set(source.exercises.map(e=>e.wordId)).size,12);
 const exercises=source.exercises.map((e,i)=>({
  exerciseId:`${id}:${String(i+1).padStart(2,'0')}`,wordId:e.wordId,componentId:'ALF-CMP-001',contractVersion:'1.0',mode:'model',groupActivity:'meet',
  title:'Kijk en luister',assessment:'participation',requiresAudio:true,
  text:{primary:e.cards[0].back.text},prompt:{image:e.cards[0].front.image,audio:e.cards[0].audio},
  instructionAudio:{audioId:'KEL-INS-0b8fcd7a329d',src:'/package-audio/kijk-luister-20261029/KEL-INS-0b8fcd7a329d.mp3'},
  targetWordIds:e.targetWordIds,sourceLessonIds:e.sourceLessonIds,sourceExerciseId:e.sourceExerciseId,
  sourceContentIds:e.sourceContentIds,sourceDocumentId:e.sourceDocumentId,sourceStatus:e.sourceStatus,
  contentLevel:row.level,vocabularyLevels:[row.level],independentReading:false,reviewEligible:false,access:'supported-listening'
 }));
 const bytes=JSON.stringify({id,exercises}),hash=createHash('sha256').update(bytes).digest('hex').slice(0,16);
 const url=`/practice-content/klink-20261029/${id.replaceAll(':','-')}-${hash}.json`;
 writeFileSync('public'+url,bytes);
 return {...row,id,activity:'meet',title:row.title.replace(' · beelden',' · woorden'),url};
});
writeFileSync(path,JSON.stringify([...index.filter(r=>!r.id.startsWith('word-meet:')), ...added],null,2)+'\n');
console.log(Object.fromEntries(['alfa-c','a1','a2','b1'].map(level=>[level,added.filter(r=>r.level===level).length*12])));
