import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {chromium,webkit} from 'playwright';
import {writingDictationRounds} from '../lib/writing-dictation.ts';
import {chapterHash} from '../lib/practice-chapters.ts';
import {collectionProgressId} from '../lib/round-progress.ts';
import {groupSessionKey} from '../lib/group-practice.ts';
const base=process.env.KLINK_TEST_BASE||'http://127.0.0.1:19031',out=process.env.KLINK_TEST_OUTPUT||'docs/writing-dictation-20261101/local';mkdirSync(out,{recursive:true});
const audit=JSON.parse(readFileSync('docs/writing-dictation-20261101/audio-audit.json'));
const hashes=[],decoded=[],played=[],errors=[];
try{
 assert(audit.passed);assert.equal(audit.files.length,107);assert.equal(audit.targets.length,100);assert(audit.targets.every(t=>t.passed));
 for(let i=0;i<audit.files.length;i+=8)await Promise.all(audit.files.slice(i,i+8).map(async f=>{
  const response=await fetch(base+f.src);assert.equal(response.status,200,f.src);const bytes=Buffer.from(await response.arrayBuffer());assert.equal(bytes.length,f.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),f.sha256,f.src);
  assert(f.metadataPassed);hashes.push({src:f.src,bytes:bytes.length,sha256:f.sha256,sourceAndHostedIdentical:true,taalrouteMetadataRetained:true});
 }));
 for(const[engine,type]of Object.entries({chromium,webkit})){
  const b=await type.launch({headless:true,...(engine==='chromium'?{channel:'chrome'}:{})});
  try{
   const p=await b.newPage();p.on('pageerror',e=>errors.push({engine,message:e.message}));
   await p.addInitScript(()=>{window.__nativeEnded=[];const seen=new WeakSet();window.addEventListener('klink-audio-source',event=>{const audio=event.detail;if(seen.has(audio))return;seen.add(audio);audio.addEventListener('ended',()=>window.__nativeEnded.push({src:new URL(audio.currentSrc||audio.src).pathname,duration:audio.duration,nativeElement:audio instanceof HTMLAudioElement}));});});
   await p.goto(base);
   const native=await p.evaluate(async sources=>{const c=new AudioContext(),checks=[];for(const src of sources){const response=await fetch(src);if(!response.ok)throw Error(src);const a=await c.decodeAudioData(await response.arrayBuffer());if(!a.duration||!a.length)throw Error('Empty '+src);checks.push({src,duration:a.duration,channels:a.numberOfChannels,sampleRate:a.sampleRate,frames:a.length});}await c.close();return checks;},audit.files.map(f=>f.src));assert.equal(native.length,107);decoded.push({engine,files:native});
   for(const id of ['001','007','010','043','047','082','083','088','100'].map(n=>'KSW-AC-HT-'+n)){
    const round=writingDictationRounds.find(r=>r.exercises.some(e=>e.writingSourceId===id)),e=round.exercises.find(e=>e.writingSourceId===id);
    await p.evaluate(({key,id})=>localStorage.setItem(key,JSON.stringify({version:1,exerciseId:id,done:false})),{key:groupSessionKey('chapter:dictation:'+round.id,'dictation',collectionProgressId('dictation',round.id)),id:e.exerciseId});
    await p.goto('about:blank');await p.goto(base+'/'+chapterHash({chapter:'writing',activity:'dictation',collection:round.id,level:'alfa-c',help:'practice'}));await p.locator(`[data-exercise-id="${e.exerciseId}"]`).waitFor();
    for(const[role,src,selector]of [['instruction',e.instructionAudio.src,'.cp-instruction-listen'],['target',e.prompt.audio.src,'button[aria-label="Luister naar het woord"]']]){
     await p.evaluate(()=>{window.__nativeEnded=[];});await p.locator(selector).click();await p.waitForFunction(src=>window.__nativeEnded.some(x=>x.src===src),src,{timeout:30000});
     const result=await p.evaluate(src=>window.__nativeEnded.find(x=>x.src===src),src);assert(result.nativeElement&&result.duration>0);played.push({engine,sourceId:id,role,...result,playedThroughExistingControl:true,ended:true});
    }
   }
  }finally{await b.close();}
 }
 assert.deepEqual(errors,[]);
}catch(e){errors.push({failure:e.stack});throw e;}finally{writeFileSync(out+'/media-checks.json',JSON.stringify({base,hashes,decoded,played,errors,humanListeningPerformed:false,simulatedPlayback:false},null,2)+'\n');}
console.log('Passed:107 offered files byte-identical,214 native decodes,36 native instruction/target playback completions.');
