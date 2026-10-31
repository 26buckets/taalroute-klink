import{readFileSync as read,writeFileSync as write}from'node:fs';import{execFileSync as exec}from'node:child_process';import{createHash}from'node:crypto';import assert from'node:assert/strict';
import{functionalBlocks,functionalAudio}from'../../lib/alfa-c-functioneel.ts';import{teacherTasks}from'../../lib/alfa-c-docent.ts';import{productionIndex}from'../../lib/production-practice.ts';
const paths=new Set();const clips=JSON.parse(read('docs/imported-alfa-c-release-20261031/audio.json'));clips.forEach(c=>paths.add(c.src));
for(const s of functionalBlocks.flatMap(b=>b.steps).filter(s=>['werk-09','werk-10','werk-11','verbinden-09','lijst-02','lijst-06','werk-03'].some(id=>s.id.endsWith(id)))){
 for(const t of[s.instruction,s.helpVisible,s.retryVisible,s.exampleInstruction,s.successFeedback,s.automaticAcknowledgement].filter(Boolean))paths.add(functionalAudio('guide',t));
 for(const t of[...s.exampleTargetTexts,...s.dictationTexts,...s.presentation.filter(v=>!['previousResponse','audioOnly'].includes(v.kind)).map(v=>v.text)])paths.add(functionalAudio('target',t));
}
teacherTasks.find(t=>t.id==='kg-ga-c-02-001').stages.flatMap(s=>s.audio).forEach(p=>paths.add(p));
const support=JSON.parse(read('data/klink-b1-reading-support.json'));
for(const row of productionIndex.filter(r=>support.collections[r.id]))for(const e of JSON.parse(read('public'+row.url)).exercises.filter(e=>support.collections[row.id].supportIds.includes(e.exerciseId))){e.textBlocks.forEach(t=>paths.add(t.audio.src));paths.add(e.instructionAudio.src);}
const result=[];for(const src of paths){assert(src);const f='public'+src;const probe=JSON.parse(exec('ffprobe',['-v','error','-show_format','-of','json',f]));const tags=probe.format.tags;for(const k of['artist','album_artist'])assert.equal(tags[k],'Taalroute',f);assert(!/suno|elevenlabs|generator|openai/i.test(JSON.stringify(tags)));exec('ffmpeg',['-v','error','-i',f,'-f','null','-']);result.push({src,sha256:createHash('sha256').update(read(f)).digest('hex'),duration:Number(probe.format.duration),metadata:tags,decoded:true});}
write('docs/imported-alfa-c-release-20261031/associated-audio.json',JSON.stringify(result,null,2));console.log('PASS',result.length,'associated files decoded and metadata checked');
