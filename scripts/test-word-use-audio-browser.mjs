import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
import {wordUseCollections} from '../lib/word-use.ts';
import {chapterHash} from '../lib/practice-chapters.ts';
const cache='/Users/nicoknoester/.cache/klink-word-use-20261101';
const base=process.env.KLINK_TEST_URL||'http://127.0.0.1:'+readFileSync(cache+'/dev-port.txt','utf8');
const out='docs/word-use-20261101/'+(base.startsWith('https')?'online':'local');mkdirSync(out,{recursive:true});
const audio=JSON.parse(readFileSync('docs/word-use-20261101/audio.json'));
const native=[],decoded=[],errors=[];
const checkpoint=()=>writeFileSync(out+'/audio-browser-progress.json',JSON.stringify({native,decoded,errors},null,2)+'\n');
const route=c=>'/'+chapterHash({chapter:c.exercises[0].mode==='word-combinations'?'words':'listening',activity:c.exercises[0].mode,collection:c.id,level:c.level,help:'practice'});
const choice=page=>page.locator('.cp-choice-grid .cp-extended-option > button:first-child');
for(const engine of [chromium,webkit]){const browser=await engine.launch({headless:true});try{
  const ctx=await browser.newContext({viewport:{width:1366,height:768}}),p=await ctx.newPage();
  p.on('pageerror',e=>errors.push({engine:engine.name(),message:e.message}));
  await p.addInitScript(()=>{
   window.__nativeAudio=[];
   // oxlint-disable-next-line typescript/unbound-method -- Forward native playback with its original media element as this.
   const original=HTMLMediaElement.prototype.play;
   HTMLMediaElement.prototype.play=function(...args){const row={src:this.src,ended:false,duration:this.duration};window.__nativeAudio.push(row);this.addEventListener('loadedmetadata',()=>{row.duration=this.duration;},{once:true});this.addEventListener('ended',()=>{row.ended=true;},{once:true});return original.apply(this,args);};
  });
  for(const activity of ['word-combinations','suitable-reply'])for(const level of ['a1','a2','b1']){
   const c=wordUseCollections.find(c=>c.level===level&&c.exercises[0].mode===activity),e=c.exercises[0];
   await p.evaluate(()=>{window.__nativeAudio=[];});
   await p.goto(base+route(c));await p.locator('[data-exercise-id]').waitFor();assert.equal(await p.evaluate(()=>window.__nativeAudio.length),0,'No forced narration on a new card');
   await p.getByRole('button',{name:activity==='word-combinations'?'Luister naar de combinatie en de antwoorden':'Luister naar de ander en de antwoorden',exact:true}).click();
   await p.waitForFunction(()=>window.__nativeAudio.length===6&&window.__nativeAudio.every(x=>x.ended),null,{timeout:120000});
   const clips=await p.evaluate(()=>window.__nativeAudio);assert.deepEqual(clips.map(x=>new URL(x.src).pathname),[e.instructionAudio.src,e.prompt.audio.src,...e.options.map(o=>o.audio.src)]);
   assert(clips.every(x=>x.ended===true));assert.equal(await choice(p).first().isDisabled(),false);native.push({engine:engine.name(),activity,level,clips});
   if(level==='a1'&&activity==='word-combinations'){
    await p.getByRole('button',{name:'Luister naar de combinatie en de antwoorden',exact:true}).focus();
    await p.keyboard.press('Space');await p.waitForFunction(()=>window.__nativeAudio.length===11&&window.__nativeAudio.every(x=>x.ended),null,{timeout:90000});
    assert.deepEqual((await p.evaluate(()=>window.__nativeAudio.slice(6))).map(x=>new URL(x.src).pathname),[e.prompt.audio.src,...e.options.map(o=>o.audio.src)]);
   }
   checkpoint();
  }
  // Decode every delivered recording, using the browser's real codec and actual bytes.
  await p.goto(base+route(wordUseCollections[0]));await p.locator('[data-exercise-id]').waitFor();
  const results=await p.evaluate(async rows=>{
   const ctx=new AudioContext(),out=[];let at=0;
   async function worker(){while(at<rows.length){const row=rows[at++],r=await fetch(row.src);if(!r.ok)throw Error('Audio HTTP '+r.status+': '+row.src);const bytes=await r.arrayBuffer(),hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join(''),buffer=await ctx.decodeAudioData(bytes.slice(0));if(hash!==row.sha256||buffer.duration<=.2)throw Error('Audio mismatch '+row.src);out.push({src:row.src,sha256:hash,duration:buffer.duration});}}
   await Promise.all([worker(),worker(),worker(),worker()]);await ctx.close();return out;
  },audio.map(c=>({src:c.src,sha256:c.sha256})));assert.equal(results.length,audio.length);decoded.push({engine:engine.name(),clips:results});
  await ctx.close();
}finally{await browser.close();}}
assert.equal(native.length,12);assert.equal(decoded.length,2);assert.deepEqual(errors,[]);
writeFileSync(out+'/audio-browser-checks.json',JSON.stringify({native,decoded,errors},null,2)+'\n');
console.log(JSON.stringify({nativeSequences:native.length,decoded:decoded.reduce((n,e)=>n+e.clips.length,0),errors:errors.length}));
