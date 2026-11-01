import {mkdirSync,writeFileSync,existsSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {localGrammarExercises as exercises} from '../lib/local-grammar-lessons.ts';
import {wordAudioParts,wordAudioIndex} from '../lib/word-audio.ts';
import {chapterCollections,chapterHash} from '../lib/practice-chapters.ts';
const out=process.env.KLINK_TEST_OUTPUT;if(!out)throw Error('Set KLINK_TEST_OUTPUT');mkdirSync(out,{recursive:true});
const words=new Map();
for(const e of exercises){
 const t=e.standardTask,c=e.contentTask;
 const texts=[e.title,e.sourceTranscript,t?.before,t?.after,t?.help,t?.model,c?.stimulus,c?.prompt,c?.feedback.correct,c?.feedback.retry,...(t?.options??[]).map(o=>o.label),...(c?.options??[]).map(o=>o.text)].filter(Boolean);
 for(const text of texts)for(const p of wordAudioParts(text).filter(p=>p.word)){const row=words.get(p.word)??{word:p.word,exerciseIds:[],...wordAudioIndex.get(p.word)};if(!row.exerciseIds.includes(e.exerciseId))row.exerciseIds.push(e.exerciseId);words.set(p.word,row);}
}
const recordings=[...words.values()].filter(w=>w.src).map(w=>({...w,exists:existsSync('public'+w.src),sha256:existsSync('public'+w.src)?createHash('sha256').update(readFileSync('public'+w.src)).digest('hex'):null}));
const missing=[...words.values()].filter(w=>!w.src);
const result={wordForms:words.size,linked:recordings.length,missingBindings:missing,missingFiles:recordings.filter(w=>!w.exists),recordings,wholeSentenceRecordings:exercises.filter(e=>e.requiresAudio).map(e=>({exerciseId:e.exerciseId,transcript:e.sourceTranscript,...e.prompt.audio,exists:existsSync('public'+e.prompt.audio.src)})),newRecordings:0,humanListeningReview:'Not repeated; existing source and word audio retained.'};
writeFileSync(out+'/audio-inventaris.json',JSON.stringify(result,null,2));
writeFileSync(out+'/leskoppelingen.json',JSON.stringify(chapterCollections('grammar-path').filter(c=>c.exercises[0].localGrammar).map(c=>({title:c.title,level:c.level,packageId:c.pack.id,lessonId:c.exercises[0].lessonId,status:c.pack.status==='local-proposal'?'proposal-not-scheduled':'existing-lesson-addition-not-scheduled',exerciseIds:c.exercises.map(e=>e.exerciseId),url:'http://127.0.0.1:18984/'+chapterHash({chapter:'grammar',activity:'grammar-path',collection:c.id,level:c.level,help:'practice'})})),null,2));
console.log(JSON.stringify({wordForms:words.size,linked:recordings.length,missing:missing.map(w=>w.word),missingFiles:result.missingFiles.length}));
