import assert from 'node:assert/strict';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
import {chapterHash} from '../lib/practice-chapters.ts';
import {recordingForWord,wordRecordingKey} from '../lib/word-listening.ts';
import {spokenWords} from '../lib/word-listening-text.ts';
const d='docs/writing-messages-texts-20261103/',base=process.env.KLINK_TEST_BASE||'http://127.0.0.1:19036',out=process.env.KLINK_TEST_OUTPUT||'/tmp/klink-messages-texts-local';
const j=p=>JSON.parse(readFileSync(p)),a=j(d+'audio-review.json'),words=new Set(a.selected.filter(x=>x.word).map(x=>x.word));
const rows=j(d+'import-manifest.json').newRows.map(x=>x.row),checks=[],played=[];
const fixtures=['functional-message','write'].map(activity=>{
 for(const row of rows.filter(x=>x.activity===activity)){
  const e=j('public'+row.url).exercises[0];
  const text=[e.sourceWritingContext,...e.sourceWritingSupport,...e.sourceWritingCriteria,...e.sourceWritingExamples.flatMap(m=>[m.text,m.explanation])].filter(Boolean).join(' ');
  const word=spokenWords(text).map(x=>x.key).find(x=>words.has(x));if(word)return {row,e,word};
 }
 throw Error('No source fixture for '+activity);
});
await Promise.all(Object.entries({chromium,webkit}).map(async([engine,type])=>{
 const b=await type.launch({headless:true,...(engine==='chromium'?{channel:'chrome'}:{})});
 try{
  for(const [width,height]of[[1280,844],[320,568]])for(const theme of ['light','dark'])for(const {row,e,word}of fixtures){
   const c=await b.newContext({viewport:{width,height}});await c.addInitScript(()=>{window.ended=[];const seen=new WeakSet();window.addEventListener('klink-audio-source',ev=>{const a=ev.detail;if(seen.has(a))return;seen.add(a);a.addEventListener('ended',()=>window.ended.push({key:a.dataset.klinkSource,native:a instanceof HTMLAudioElement,seconds:a.duration}));});});
   const p=await c.newPage();await p.goto(base);await p.evaluate(theme=>window.TaalrouteAppearance.set(theme),theme);
   await p.goto(base+'/'+chapterHash({chapter:'writing',activity:row.activity,collection:row.id,level:row.level,help:row.help}));
   const task=p.locator('[data-source-writing-text="'+e.exerciseId+'"]'),own='  Mijn eerste zin.\n'+('langwoord'.repeat(50));
   await task.locator('textarea').fill(own);await task.getByRole('button',{name:'Bewaar en vergelijk',exact:true}).click();const finish=task.getByRole('button',{name:'Nagekeken en klaar',exact:true});await finish.waitFor();
   if(width===1280&&theme==='light'){
    const button=task.locator('[data-word-audio="'+word+'"]').first();await button.click();const r=recordingForWord(word);assert.equal(r.src,a.bundle.src);await p.waitForFunction(key=>window.ended.some(x=>x.key===key&&x.native&&x.seconds>0),wordRecordingKey(r));played.push({engine,word,activity:row.activity,realAudio:true});
   }
   await finish.click();await p.locator('[data-practice-next]:not(:disabled)').waitFor();assert.equal(await task.locator('.cp-source-text').nth(1).locator('p').last().textContent(),own);
   const g=await task.evaluate(el=>({page:document.documentElement.scrollWidth,inner:el.scrollWidth,width:el.clientWidth,font:parseFloat(getComputedStyle(el.querySelector('textarea')).fontSize)}));
   assert(g.page<=width+1&&g.inner<=g.width+1&&g.font>=16,JSON.stringify(g));
   checks.push({engine,width,height,theme,sourceId:e.exerciseId,activity:row.activity,longTextPreserved:true,noHorizontalOverflow:true});await c.close();
  }
 }finally{await b.close();}
}));
assert.equal(checks.length,16);assert.equal(played.length,4);mkdirSync(out,{recursive:true});writeFileSync(out+'/layout-native.json',JSON.stringify({base,checks,played,physicalDevicesTested:false},null,2)+'\n');
console.log('16 layouts and 4 native target clips passed.');
