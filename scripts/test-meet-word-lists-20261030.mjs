import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {chapterCollections} from '../lib/practice-chapters.ts';
const index=JSON.parse(readFileSync('data/klink-production-index.json')),added=index.filter(r=>r.id.startsWith('word-meet:'));
const baseline=JSON.parse(execFileSync('git',['show','66ec3578ca1df93cf50c8578d137ddb6ade1ec97:data/klink-production-index.json']));
assert.deepEqual(index.filter(r=>!r.id.startsWith('word-meet:')),baseline);
const summary={},audio=new Set(),images=new Set();let placeholders=0;
for(const row of added){
 const source=index.find(s=>s.id===row.id.replace('word-meet:','beta-images:cards:'));assert(source);assert.equal(row.level,source.level);assert.equal(row.count,12);
 const es=JSON.parse(readFileSync('public'+row.url)).exercises,ss=JSON.parse(readFileSync('public'+source.url)).exercises;
 assert.equal(es.length,12);assert.equal(new Set(es.map(e=>e.wordId)).size,12);
 for(const [i,e] of es.entries()){
  const s=ss[i];assert.equal(e.text.primary,s.cards[0].back.text);assert.deepEqual(e.prompt,{image:s.cards[0].front.image,audio:s.cards[0].audio});
  assert.deepEqual(e.sourceContentIds,s.sourceContentIds);assert.equal(e.sourceDocumentId,s.sourceDocumentId);assert.equal(e.contentLevel,row.level);assert.equal(e.mode,'model');assert.equal(e.reviewEligible,false);
  audio.add(e.prompt.audio.src);audio.add(e.instructionAudio.src);images.add(e.prompt.image.src);if(e.prompt.image.placeholderWord)placeholders++;
 }
 summary[row.level]??={rounds:0,words:0};summary[row.level].rounds++;summary[row.level].words+=es.length;
}
assert.deepEqual(Object.values(summary).map(s=>s.words),[192,144,96,144]);
for(const src of audio){const probe=JSON.parse(execFileSync('ffprobe',['-v','quiet','-show_format','-of','json','public'+src]));const tags=probe.format.tags;assert(Number(probe.format.duration)>0);assert.equal(tags.artist,'Taalroute',src);assert.equal(tags.album_artist,'Taalroute',src);assert(/Taalroute|Klink/.test(tags.album),src);assert(!/suno|openai|elevenlabs/i.test(JSON.stringify(tags)),src);}
for(const level of Object.keys(summary))summary[level].total=chapterCollections('meet').filter(r=>r.level===level&&r.help==='practice').reduce((n,r)=>n+(r.exerciseCount??r.exercises.length),0);
const report={summary,collections:added.length,wordPlacements:576,placeholderPlacements:placeholders,audio:[...audio],images:[...images],baselinePreserved:true,audioMetadata:true};
writeFileSync('docs/meet-words-20261030/content.json',JSON.stringify(report,null,2));console.log(JSON.stringify({...report,audio:audio.size,images:images.size}));
