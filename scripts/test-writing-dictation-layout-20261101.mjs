import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
import {writingDictationRounds} from '../lib/writing-dictation.ts';
import {chapterHash} from '../lib/practice-chapters.ts';
import {groupSessionKey} from '../lib/group-practice.ts';
import {collectionProgressId} from '../lib/round-progress.ts';
const base=process.env.KLINK_TEST_BASE||'http://127.0.0.1:19031',out=process.env.KLINK_TEST_OUTPUT||'docs/writing-dictation-20261101/local';mkdirSync(out+'/screens',{recursive:true});
const checks=[],errors=[];
try{for(const[engine,type]of Object.entries({chromium,webkit})){
 const b=await type.launch({headless:true,...(engine==='chromium'?{channel:'chrome'}:{})});
 try{for(const width of[1280,390,320])for(const theme of['light','dark'])for(const n of[0,42,99]){
  const c=await b.newContext({viewport:{width,height:width===320?568:844}}),p=await c.newPage();
  await c.addInitScript(()=>{window.Audio=class extends EventTarget{constructor(src){super();this.src=src;this.paused=true;this.currentTime=0;this.playbackRate=1;}play(){this.paused=false;this.timer=setTimeout(()=>{this.paused=true;this.dispatchEvent(new Event('ended'));},20);return Promise.resolve();}pause(){this.paused=true;clearTimeout(this.timer);}};});
  p.on('pageerror',e=>errors.push({engine,width,theme,message:e.message}));
  const id='KSW-AC-HT-'+String(n+1).padStart(3,'0'),round=writingDictationRounds.find(r=>r.exercises.some(e=>e.writingSourceId===id)),e=round.exercises.find(e=>e.writingSourceId===id),route=base+'/'+chapterHash({chapter:'writing',activity:'dictation',collection:round.id,level:'alfa-c',help:'practice'});
  await p.goto(base);await p.evaluate(({theme,key,id})=>{window.TaalrouteAppearance.set(theme);localStorage.setItem(key,JSON.stringify({version:1,exerciseId:id,done:false}));},{theme,key:groupSessionKey('chapter:dictation:'+round.id,'dictation',collectionProgressId('dictation',round.id)),id:e.exerciseId});
  await p.goto('about:blank');await p.goto(route);await p.locator(`[data-exercise-id="${e.exerciseId}"]`).waitFor();
  const automatic=p.locator('[data-practice-automatic]');if(await automatic.getAttribute('aria-pressed')==='false')await automatic.click();
  assert.equal(await p.locator('html').getAttribute('data-theme'),theme);
  await p.waitForFunction(()=>!document.querySelector('.cp-text-entry input')?.disabled);
  for(const state of['question','correct']){
   if(state==='correct'){await p.getByRole('textbox',{name:'Jouw antwoord',exact:true}).fill(e.helpWord);await p.getByRole('button',{name:'Controleer',exact:true}).click();await p.locator('[data-practice-ready="true"]').waitFor();assert((await p.locator('.cp-exercise-feedback').innerText()).includes(e.correctFeedback));}
   const box=await p.evaluate(()=>({viewport:innerWidth,scroll:document.documentElement.scrollWidth,input:document.querySelector('.cp-text-entry input').getBoundingClientRect().toJSON(),buttons:[...document.querySelectorAll('.cp-task-card button')].filter(b=>b.getBoundingClientRect().width>0).map(b=>({label:b.getAttribute('aria-label')||b.textContent,width:b.getBoundingClientRect().width,height:b.getBoundingClientRect().height}))}));
   assert(box.scroll<=box.viewport+1,`${engine} ${width} ${theme} ${state}`);assert(box.input.x>=0&&box.input.right<=width+1);assert(box.buttons.every(b=>b.width>=43&&b.height>=43));
   await p.screenshot({path:`${out}/screens/${engine}-${width}-${theme}-${n}-${state}.png`,fullPage:true});
   checks.push({engine,width,theme,sourceId:e.writingSourceId,state,noHorizontalOverflow:true,buttonsAtLeast44:true,correctExplanation:state==='correct',requiredCueVisible:e.meaningCue?await p.getByText(e.meaningCue,{exact:true}).isVisible():null});
  }
  await c.close();
 }}finally{await b.close();}
}}finally{writeFileSync(out+'/layout.json',JSON.stringify({base,simulatedPlayback:true,checks,errors},null,2)+'\n');}
assert.equal(checks.length,72);assert.deepEqual(errors,[]);console.log('Passed: 72 task/feedback layouts at 1280/390/320 in light/dark, Chromium/WebKit.');
