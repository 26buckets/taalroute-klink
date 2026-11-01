import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
import {sourceRepeatRounds,sourceRepeatBanks,sourceRepeatExercises} from '../lib/source-repeat.ts';
import {chapterHash} from '../lib/practice-chapters.ts';
const base=process.env.KLINK_TEST_BASE||'http://127.0.0.1:19031';
const out=process.env.KLINK_TEST_OUTPUT||'docs/repeat-rounds-20261101/local';mkdirSync(out,{recursive:true});
const banks=new Map();for(const r of sourceRepeatRounds)for(const b of sourceRepeatBanks(r))if(!banks.has(b.id))banks.set(b.id,JSON.parse(readFileSync('public'+b.url)).exercises);
const candidates=sourceRepeatRounds.flatMap(r=>sourceRepeatExercises(r,banks).map(e=>({round:r,e})));
const samples=['heard-word','hear-match','text-question'].map(mode=>candidates.filter(x=>x.e.mode===mode).sort((a,b)=>JSON.stringify(b.e.sourceText??b.e.targets??b.e.options).length-JSON.stringify(a.e.sourceText??a.e.targets??a.e.options).length)[0]);
const checks=[],errors=[];
try{for(const[engine,type]of Object.entries({chromium,webkit})){
 const b=await type.launch({headless:true,...(engine==='chromium'?{channel:'chrome'}:{})});
 try{for(const[width,height]of[[1280,800],[390,844],[320,568]])for(const theme of['light','dark'])for(const{round,e}of samples){
  const c=await b.newContext({viewport:{width,height},colorScheme:theme,hasTouch:width<800});
  await c.addInitScript(({round,id})=>{
   localStorage.setItem(`klink.group.v1:chapter:learning-review:${round}:learning-review`,JSON.stringify({version:1,done:false,exerciseId:id}));
   window.Audio=class extends EventTarget{constructor(src){super();this.src=src;this.paused=true;}play(){this.paused=false;this.t=setTimeout(()=>{this.paused=true;this.dispatchEvent(new Event('ended'));},20);return Promise.resolve();}pause(){clearTimeout(this.t);this.paused=true;}};
  },{round:round.id,id:e.exerciseId});
  const p=await c.newPage();p.on('pageerror',e=>errors.push({engine,width,theme,message:e.message}));
  await p.goto(base+'/'+chapterHash({chapter:'repeat',activity:'learning-review',collection:round.id,level:round.level,help:'practice'}));await p.locator(`[data-exercise-id="${e.exerciseId}"]`).waitFor();await p.evaluate(theme=>window.TaalrouteAppearance.set(theme),theme);assert.equal(await p.locator('html').getAttribute('data-theme'),theme);await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(150);
  const geometry=await p.evaluate(()=>{
   const box=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return{x:r.x,y:r.y,w:r.width,h:r.height,font:s.fontFamily,size:s.fontSize,weight:s.fontWeight};};
   return{width:innerWidth,horizontalOverflow:document.documentElement.scrollWidth>innerWidth+1,task:box(document.querySelector('.cp-task-card')),next:box(document.querySelector('[data-practice-next]')),buttons:[...document.querySelectorAll('.cp-choice-grid button,.cp-match-board button')].map(box)};
  });
  assert(!geometry.horizontalOverflow,`${engine} ${width} ${e.mode}`);assert(geometry.buttons.length);assert(geometry.buttons.every(r=>r.w>=44&&r.h>=44&&r.x>=-1&&r.x+r.w<=width+1));
  assert(geometry.next.x>=-1&&geometry.next.x+geometry.next.w<=width+1&&geometry.next.h>=44);
  assert(await p.getByRole('button',{name:'Over deze oefening',exact:true}).isVisible());
  await p.getByRole('button',{name:'Over deze oefening',exact:true}).click();const dialog=p.getByRole('dialog');await dialog.waitFor();const d=await dialog.boundingBox();assert(d.x>=-1&&d.y>=-1&&d.x+d.width<=width+1&&d.y+d.height<=height+1);await p.keyboard.press('Escape');
  const file=`${engine}-${width}-${theme}-${e.mode}.png`;await p.screenshot({path:out+'/'+file});
  checks.push({engine,width,height,theme,mode:e.mode,position:e.exerciseId,geometry,actualTheme:theme,buttonsReachable:true,noHorizontalOverflow:true,goalDialogFits:true,screenshot:file});await c.close();
 }}finally{await b.close();}
}assert.equal(checks.length,36);assert.deepEqual(errors,[]);
}catch(e){errors.push({failure:e.stack});throw e;}finally{writeFileSync(out+'/layout-checks.json',JSON.stringify({base,checks,errors,physicalPhoneTested:false},null,2)+'\n');}
console.log('PASS 36 existing-player layouts and goal dialogs across desktop/mobile, light/dark and two browsers.');
