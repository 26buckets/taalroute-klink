import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
import sharp from 'sharp';
import {chapterHash} from '../lib/practice-chapters.ts';
const index=JSON.parse(readFileSync('data/klink-production-index.json'));
const rows=['alfa-c','a1'].map(level=>index.find(r=>r.id===`klink10-sentences-${level}-sentence-dictation`));
const out='docs/dictation-ac-ready10-20261104/local/preservation';mkdirSync(out,{recursive:true});
const previous=JSON.parse(readFileSync(out+'/result.json'));const checks=previous.checks;
try{for(const[engine,type]of Object.entries({chromium,webkit})){
 const browser=await type.launch({headless:true,...(engine==='chromium'?{channel:'chrome'}:{})});
 try{for(const width of [390,1280])for(const row of rows){
  if(checks.some(c=>c.engine===engine&&c.width===width&&c.sourceId===JSON.parse(readFileSync('public'+row.url)).exercises[0].exerciseId))continue;
  const e=JSON.parse(readFileSync('public'+row.url)).exercises[0],model=e.fields[0].acceptedAnswers[0],screens=[];
  for(const [name,base]of [['live','https://klink.taalroute.nl'],['local','http://127.0.0.1:19164']]){
   const page=await browser.newPage({viewport:{width,height:844}});
   await page.addInitScript(()=>{window.Audio=class extends EventTarget{constructor(src){super();this.src=src;this.dataset={};this.paused=true;this.currentTime=0;this.playbackRate=1;}play(){this.paused=false;this.timer=setTimeout(()=>{this.paused=true;this.dispatchEvent(new Event('ended'));},20);return Promise.resolve();}pause(){clearTimeout(this.timer);this.paused=true;}};});
   await page.goto(base+'/'+chapterHash({chapter:'sentences',activity:row.activity,collection:row.id,level:row.level,help:'practice'}));
   const task=page.locator(`[data-exercise-id="${e.exerciseId}"]`);await task.waitFor();await page.waitForFunction(()=>document.querySelector('.cp-text-entry input')?.disabled===false);
   const input=task.getByRole('textbox',{name:'Jouw antwoord',exact:true}),loose=model.toLowerCase().replace(/[.!]/g,'');
   await input.fill(loose);await task.getByRole('button',{name:'Controleer',exact:true}).click();assert.equal(await task.getAttribute('data-practice-ready'),e.sentenceAnswerPolicy==='exact-copy'?'false':'true');
   await input.fill(model);await task.getByRole('button',{name:'Controleer',exact:true}).click();assert.equal(await task.getAttribute('data-practice-ready'),'true');
   const saved=await page.evaluate(id=>JSON.parse(localStorage.getItem('klink.writing-answer.v1:'+id)),e.writingSourceId);assert.equal(saved.first,loose);assert.equal(saved.last,model);
   await page.evaluate(()=>document.fonts.ready);await page.waitForFunction(()=>document.getAnimations().every(a=>a.playState!=='running'));screens.push(await page.screenshot({path:`${out}/${engine}-${width}-${row.level}-${name}.png`,fullPage:true,animations:'disabled',caret:'hide'}));await page.close();
  }
  const a=await sharp(screens[0]).raw().toBuffer(),b=await sharp(screens[1]).raw().toBuffer();assert.equal(a.length,b.length);
  let differingChannels=0,maxChannelDelta=0;for(let i=0;i<a.length;i++){if(a[i]!==b[i])differingChannels++;maxChannelDelta=Math.max(maxChannelDelta,Math.abs(a[i]-b[i]));}
  assert(differingChannels===0,`${engine} ${width} ${row.level} screenshot differs`);
  checks.push({engine,width,sourceId:e.exerciseId,policy:e.sentenceAnswerPolicy,existingCriteriaAndStoragePreserved:true,pixelIdentical:differingChannels===0,differingChannels,maxChannelDelta});
 }}finally{await browser.close();}
}}finally{writeFileSync(out+'/result.json',JSON.stringify({checks,simulatedAudio:true},null,2)+'\n');}
assert.equal(checks.length,8);console.log('Eight live/local screen pairs are pixel-identical; 16 existing exact-copy/dictation flows preserve criteria and stored answers.');
