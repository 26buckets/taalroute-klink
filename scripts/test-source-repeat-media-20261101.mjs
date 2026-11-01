import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {chromium,webkit} from 'playwright';
import {sourceRepeatRounds,sourceRepeatBanks,sourceRepeatExercises} from '../lib/source-repeat.ts';
import {chapterHash} from '../lib/practice-chapters.ts';
const base=process.env.KLINK_TEST_BASE||'http://127.0.0.1:19031';
const out=process.env.KLINK_TEST_OUTPUT||'docs/repeat-rounds-20261101/local';mkdirSync(out,{recursive:true});
const audit=JSON.parse(readFileSync('docs/repeat-rounds-20261101/audio-audit.json'));
const hashes=[],decoded=[],played=[],errors=[];
const banks=new Map();for(const r of sourceRepeatRounds)for(const b of sourceRepeatBanks(r))if(!banks.has(b.id))banks.set(b.id,JSON.parse(readFileSync('public'+b.url)).exercises);
try{
 assert.equal(audit.files.length,417);assert(audit.passed);
 for(let i=0;i<audit.files.length;i+=8)await Promise.all(audit.files.slice(i,i+8).map(async f=>{
  const response=await fetch(base+f.src);assert.equal(response.status,200,f.src);const bytes=Buffer.from(await response.arrayBuffer());
  assert.equal(bytes.length,f.bytes,f.src);assert.equal(createHash('sha256').update(bytes).digest('hex'),f.sha256,f.src);
  hashes.push({src:f.src,bytes:bytes.length,sha256:f.sha256,sourceAndHostedIdentical:true,taalrouteMetadataRetained:true});
 }));
 for(const[engine,type]of Object.entries({chromium,webkit})){
  const b=await type.launch({headless:true,...(engine==='chromium'?{channel:'chrome'}:{})});
  try{
   const p=await b.newPage();p.on('pageerror',e=>errors.push({engine,message:e.message}));
   await p.addInitScript(()=>{
    window.__nativeEnded=[];const seen=new WeakSet();
    window.addEventListener('klink-audio-source',event=>{
     const audio=event.detail;if(seen.has(audio))return;seen.add(audio);
     audio.addEventListener('ended',()=>window.__nativeEnded.push({src:new URL(audio.currentSrc||audio.src).pathname,duration:audio.duration,nativeElement:audio instanceof HTMLAudioElement}));
    });
   });await p.goto(base);
   const native=await p.evaluate(async sources=>{
    const context=new AudioContext(),checks=[];
    for(const src of sources){const response=await fetch(src);if(!response.ok)throw new Error('Unavailable '+src);const audio=await context.decodeAudioData(await response.arrayBuffer());if(!audio.duration||!audio.length)throw new Error('Empty '+src);checks.push({src,duration:audio.duration,channels:audio.numberOfChannels,frames:audio.length,sampleRate:audio.sampleRate});}
    await context.close();return checks;
   },audit.files.map(f=>f.src));assert.equal(native.length,417);decoded.push({engine,files:native});
   for(const mode of['heard-word','hear-match','text-question']){
    const round=sourceRepeatRounds.find(r=>sourceRepeatExercises(r,banks).some(e=>e.mode===mode));
    const exercises=sourceRepeatExercises(round,banks),e=exercises.find(e=>e.mode===mode);
    await p.evaluate(({round,id})=>localStorage.setItem(`klink.group.v1:chapter:learning-review:${round}:learning-review`,JSON.stringify({version:1,done:false,exerciseId:id})),{round:round.id,id:e.exerciseId});
    await p.goto('about:blank');await p.goto(base+'/'+chapterHash({chapter:'repeat',activity:'learning-review',collection:round.id,level:round.level,help:'practice'}));
    await p.locator(`[data-exercise-id="${e.exerciseId}"]`).waitFor();
    const src=mode==='heard-word'?e.prompt.audio.src:mode==='hear-match'?e.sources[0].audio.src:e.sourceBlocks[0].audio.src;
    await p.evaluate(()=>{window.__nativeEnded=[];});
    if(mode==='hear-match')await p.locator('.cp-match-board > div').nth(0).locator('button').first().click();
    else if(mode==='heard-word')await p.locator('.cp-instruction-listen').click();
    else await p.getByRole('button',{name:'Luister naar de tekst',exact:true}).click();
    await p.waitForFunction(src=>window.__nativeEnded.some(x=>x.src===src),src,{timeout:60000});
    const result=await p.evaluate(src=>window.__nativeEnded.find(x=>x.src===src),src);
    assert(result.nativeElement&&result.duration>0);played.push({engine,mode,...result,playedThroughExistingControl:true,ended:true});
   }
  }finally{await b.close();}
 }
 assert.deepEqual(errors,[]);
}catch(e){errors.push({failure:e.stack});throw e;}finally{writeFileSync(out+'/media-checks.json',JSON.stringify({base,hashes,decoded,played,errors,humanListeningPerformed:false,newAudioGenerated:false},null,2)+'\n');}
console.log('PASS 417 hosted audio files byte-identical; 834 native decodes; 6 native playback completions.');
