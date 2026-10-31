import assert from 'node:assert/strict';import {readFileSync as read,writeFileSync as write}from'node:fs';import{chromium,webkit}from'playwright';
import{displayedChapterCollections,chapterHash}from'../lib/practice-chapters.ts';import{readingSupportForExercise}from'../lib/production-practice.ts';import{groupSessionKey}from'../lib/group-practice.ts';
import{collectionProgressId,roundProgressPrefix}from'../lib/round-progress.ts';
const base=process.env.KLINK_TEST_URL??'http://127.0.0.1:18931',out=process.env.KLINK_RECOVERY_OUTPUT??'docs/imported-alfa-c-release-20261031';
const selection={chapter:'repeat',activity:'read-series',level:'b1',help:'guided'},collections=displayedChapterCollections('read-series',selection),extensions=collections.filter(c=>c.id.endsWith('~extension')),clips=JSON.parse(read('docs/imported-alfa-c-release-20261031/audio.json'));const checks=[],errors=[];
for(const type of[chromium,webkit]){const browser=await type.launch();try{const p=await browser.newPage();p.setDefaultTimeout(45000);p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{window.__played=[];const play=Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype,'play').value;HTMLMediaElement.prototype.play=function(){window.__played.push(this.src);this.muted=true;return play.call(this);};});
 await p.goto(base+'/#learner/home');await p.locator('.cp-home').waitFor();
 const paths=JSON.parse(read('docs/imported-alfa-c-release-20261031/associated-audio.json')).map(c=>c.src);
 const decoded=await p.evaluate(async paths=>{const ctx=new AudioContext();for(const src of paths){const r=await fetch(src);if(!r.ok)throw Error(src);const b=await ctx.decodeAudioData(await r.arrayBuffer());if(!(b.duration>0))throw Error(src);}await ctx.close();return paths.length;},paths);checks.push({engine:type.name(),associatedFilesDecoded:decoded});
 for(const c of clips){const duration=await p.evaluate(async src=>{const r=await fetch(src);if(!r.ok)throw Error(src);const ctx=new AudioContext();const decoded=await ctx.decodeAudioData(await r.arrayBuffer());await ctx.close();window.__clip=new Audio(src);window.__clip.muted=true;await window.__clip.play();return decoded.duration;},c.src);await p.waitForFunction(()=>window.__clip.currentTime>.2);await p.evaluate(()=>window.__clip.pause());assert(duration>1);checks.push({engine:type.name(),id:c.id,nativePlayback:true,duration});}
 for(const width of[1366,390]){
  await p.setViewportSize({width,height:844});await p.goto(base+'/'+chapterHash(selection));await p.locator('[data-collection]').first().waitFor();
  while(await p.getByRole('button',{name:'Meer opdrachten',exact:true}).count())await p.getByRole('button',{name:'Meer opdrachten',exact:true}).click();
  assert.equal(await p.locator('[data-collection]').count(),collections.length);assert.equal(await p.locator('[data-collection$="~extension"]').count(),50);
  const c=extensions[0],es=JSON.parse(read('public'+c.contentUrl)).exercises,target=es.find(e=>e.exerciseId===c.readingSelection.exerciseIds[0]);
  const key=roundProgressPrefix+collectionProgressId('read-series',c.readingSelection.sourceId,c.contentUrl);const prior={version:1,total:es.length,done:[es[0].exerciseId]};
  await p.evaluate(({key,prior,sessionKey})=>{localStorage.removeItem(sessionKey);localStorage.setItem(key,JSON.stringify(prior));localStorage.setItem('klink.recovery.sentinel','keep');},{key,prior,sessionKey:groupSessionKey('chapter:read-series:'+c.id,'read-series')});
  await p.locator(`[data-collection="${c.id}"]`).click();await p.locator(`[data-exercise-id="${target.exerciseId}"]`).waitFor();
  assert.equal(await p.getByRole('group',{name:'Tempo',exact:true}).count(),0);
  const hint=p.getByRole('complementary',{name:'Betekenis en voorbeeld',exact:true});await hint.waitFor();assert((await hint.innerText()).includes(readingSupportForExercise(target).example));
  await p.screenshot({path:`${out}/b1-${type.name()}-${width}.png`});
  const audio=target.textBlocks[0].audio.src;await p.getByRole('button',{name:'Luister: '+target.textBlocks[0].text,exact:true}).click();await p.waitForFunction(src=>window.__played.some(x=>x.endsWith(src)),audio);
  await p.locator('.cp-exercise-feedback').getByRole('button',{name:/Verder|Ronde afronden/}).click();
  await p.waitForFunction(({key,id})=>JSON.parse(localStorage.getItem(key)).done.includes(id),{key,id:target.exerciseId});
  const saved=await p.evaluate(key=>localStorage.getItem(key),key);assert(JSON.parse(saved).done.includes(es[0].exerciseId));
  await p.reload();await p.getByRole('button',{name:'Andere opdracht',exact:true}).first().waitFor();assert.equal(await p.evaluate(key=>localStorage.getItem(key),key),saved);
  await p.goto(base+'/'+chapterHash({...selection,collection:c.readingSelection.sourceId}));await p.locator('.cp-reading-blocks').waitFor();assert.equal(await p.evaluate(()=>localStorage.getItem('klink.recovery.sentinel')),'keep');assert.equal(await p.evaluate(key=>localStorage.getItem(key),key),saved);
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await p.goto(base+'/'+chapterHash({...selection,collection:c.id}));await p.getByRole('button',{name:'Andere opdracht',exact:true}).first().waitFor();
  checks.push({engine:type.name(),width,allCards:true,formalContext:true,originalWordAudio:true,sharedProgress:true,oldLink:true,reload:true});
 }
}finally{await browser.close();}}
assert.deepEqual(errors,[]);write(out+'/recovery-browser.json',JSON.stringify({base,checks,errors},null,2));console.log('PASS',checks.length,'reading recovery checks');
