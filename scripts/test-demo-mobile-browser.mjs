import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {taalroutePackages,exercisesForLesson} from '../lib/taalroute-packages.ts';
import {beginnerExerciseDemo,hasFirstLetterGuide} from '../lib/lesson-plan.ts';
import {progressKey} from '../lib/learner-progress.ts';
const engines=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.KLINK_TEST_URL||'http://127.0.0.1:18847',out=process.env.KLINK_DEMO_MOBILE_OUTPUT||'/tmp/klink-demo-mobile-baseline';mkdirSync(out,{recursive:true});
const all=[];
for(const pack of taalroutePackages)for(const lesson of pack.lessons)for(const exercise of exercisesForLesson(pack,lesson))if(beginnerExerciseDemo(pack,exercise,true)||hasFirstLetterGuide(exercise,true)){
 if(exercise.mode==='word-build')assert(exercise.answer.targetTileIds.every(id=>exercise.tiles.some(t=>t.id===id)));
 else if(exercise.mode==='word-image-match')assert(exercise.sources.every(s=>exercise.targets.some(t=>t.id===exercise.answer.mapping[s.id])));
 else {assert.equal(exercise.answer.correctOptionIds.length,1);assert(exercise.options.some(o=>o.id===exercise.answer.correctOptionIds[0]));}
 all.push({pack,lesson,exercise});
}
const modes=[...new Set(all.map(r=>r.exercise.mode))];assert.equal(modes.length,7);
const length=r=>Math.max(r.exercise.exampleWord?.length||0,...(r.exercise.options||r.exercise.sources||[]).map(o=>o.label?.length||0));
const samples=[...new Map(modes.flatMap(mode=>{const rows=all.filter(r=>r.exercise.mode===mode);return [rows[0],rows.toSorted((a,b)=>length(b)-length(a))[0]];}).map(r=>[r.exercise.exerciseId,r])).values()];
const checks=[],failures=[];
for(const engine of (process.env.KLINK_TEST_ENGINES||'chromium,webkit').split(',')){
 const browser=await engines[engine].launch();
 try{for(const [width,height,reducedMotion]of [[320,480,'no-preference'],[320,568,'no-preference'],[390,844,'no-preference'],[667,375,'no-preference'],[1366,900,'no-preference'],[320,568,'reduce']])for(const {pack,lesson,exercise}of samples){
  const page=await browser.newPage({viewport:{width,height},hasTouch:width<1000,reducedMotion});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(({key,position})=>{localStorage.setItem(key,JSON.stringify({completed:[],position}));localStorage.setItem('klink.demo-mobile-preserve','keep');},{key:progressKey,position:{packageId:pack.id,lessonId:lesson.id,exerciseId:exercise.exerciseId}});
  await page.goto(`${base}/#learner/home`);await page.locator('.cp-home-hero button').click();
  if(beginnerExerciseDemo(pack,exercise,true)==='repeat')await page.getByRole('button',{name:'Kijk nog eens',exact:true}).click();
  const card=page.locator('.cp-task-card').filter({has:page.getByRole('button',{name:'Nu jij',exact:true})});await card.waitFor();
  const hand=card.locator('.cp-demo-hand,.cp-demo-source > svg,.cp-match-hand');await hand.waitFor({state:'attached'});
  assert.equal(await card.locator('.cp-letter-cue').innerText(),'Kijk eerst');
  if(await card.locator('.cp-demo-hand').count()){
   const choice=card.locator('.cp-choice-grid > button.selected');
   await choice.evaluate(e=>{const a=e.getAnimations().find(a=>a.animationName==='cp-demo-select-choice');if(!a)throw Error('missing choice animation');a.pause();a.currentTime=100;});
   const before=await choice.evaluate(e=>getComputedStyle(e).backgroundColor);
   await choice.evaluate(e=>e.getAnimations().find(a=>a.animationName==='cp-demo-select-choice').currentTime=850);
   assert.notEqual(await choice.evaluate(e=>getComputedStyle(e).backgroundColor),before,'choice highlights with the tap');
  }
  const firstTime=exercise.mode==='word-image-match'?1000:850;
  await card.evaluate((el,t)=>{for(const a of el.getAnimations({subtree:true})){a.pause();a.currentTime=t;}},firstTime);
  const geometry=await card.evaluate(el=>{
   const stage=el.closest('.cp-exercise-stage').getBoundingClientRect();const nav=document.querySelector('#klink-learner-navigation')?.getBoundingClientRect();
   const top=Math.max(0,stage.top,document.querySelector('.cp-context-header')?.getBoundingClientRect().bottom||0),bottom=Math.min(innerHeight,stage.bottom,nav&&nav.width>innerWidth*.8?nav.top:innerHeight);
   const visible=e=>{if(!e)return false;const r=e.getBoundingClientRect();return r.left>=-1&&r.right<=innerWidth+1&&r.top>=top-1&&r.bottom<=bottom+1&&el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));};
   const hand=el.querySelector('.cp-demo-hand,.cp-demo-source > svg,.cp-match-hand'),button=[...el.children].find(e=>e.tagName==='BUTTON');
   const targets=[...el.querySelectorAll('.cp-choice-grid > button.selected, .cp-demo-source, .cp-match-demo .cp-demo-item')];
   return {targetVisible:targets.every(visible),handVisible:visible(hand),buttonVisible:visible(button),handWidth:hand.getBoundingClientRect().width,overflow:document.documentElement.scrollWidth>innerWidth,stage:{top,bottom},handRect:hand.getBoundingClientRect().toJSON(),buttonRect:button.getBoundingClientRect().toJSON()};
  });
  const issues=[];if(!geometry.targetVisible)issues.push('target clipped');if(!geometry.handVisible)issues.push('hand clipped');if(!geometry.buttonVisible)issues.push('Nu jij clipped');if(geometry.overflow)issues.push('horizontal overflow');
  const style=await hand.evaluate(e=>{const s=getComputedStyle(e);return{background:s.backgroundColor,fill:s.fill,border:s.borderWidth,opacity:s.opacity,animation:s.animationName};});
  if(style.background!=='rgba(0, 0, 0, 0)'||style.fill!=='rgb(201, 221, 210)'||style.border!=='0px')issues.push('hand style');
  if(Number(style.opacity)<.9)issues.push('hand hidden during tap');
  if(await card.locator(':scope > button').count()!==1)issues.push('unexpected controls');
  if(exercise.mode==='word-image-match'){
   const x=await hand.evaluate(e=>e.getBoundingClientRect().x);await card.evaluate(el=>{for(const a of el.getAnimations({subtree:true}))a.currentTime=3200;});
   if(await hand.evaluate(e=>e.getBoundingClientRect().x)<=x+40)issues.push('second tap missing');
  }
  if(width===320&&height===568&&reducedMotion==='no-preference'){
  const before=await page.evaluate(()=>localStorage.getItem('klink.taalroute.attempts.v1'));
  // Check replay after the existing audio gate has unlocked Nu jij.
  await page.getByRole('button',{name:'Nu jij',exact:true}).click();
  await page.getByRole('button',{name:'Kijk nog eens',exact:true}).click();await hand.waitFor({state:'attached'});
  if(reducedMotion!=='reduce'&&!(await hand.evaluate(e=>e.getAnimations()[0]?.currentTime<1000)))issues.push('replay did not restart');
  if(await page.evaluate(()=>localStorage.getItem('klink.taalroute.attempts.v1'))!==before)issues.push('demonstration records answer');
  if(await page.evaluate(()=>localStorage.getItem('klink.demo-mobile-preserve'))!=='keep')issues.push('storage changed');
  }
  if(errors.length)issues.push(...errors);
  const row={engine,width,height,reducedMotion,mode:exercise.mode,exerciseId:exercise.exerciseId,issues,geometry};checks.push(row);
  writeFileSync(`${out}/progress.json`,JSON.stringify({cases:checks.length,failures},null,2));
  if(issues.length){failures.push(row);await page.screenshot({path:`${out}/${engine}-${width}-${height}-${checks.length}-issue.png`});}
  else if(width===320&&height===568&&reducedMotion==='no-preference')await page.screenshot({path:`${out}/${engine}-${exercise.mode}-${checks.length}.png`});
  await page.close();
 }}finally{await browser.close();}
}
writeFileSync(`${out}/checks.json`,JSON.stringify({catalogueCount:all.length,modes,samples:samples.map(r=>({mode:r.exercise.mode,id:r.exercise.exerciseId})),checks,failures},null,2));
console.log(JSON.stringify({catalogueCount:all.length,modes:7,samples:samples.length,cases:checks.length,failures:failures.map(r=>({engine:r.engine,size:`${r.width}x${r.height}`,mode:r.mode,issues:r.issues}))}));
if(process.env.KLINK_DEMO_AUDIT!=='1')assert.equal(failures.length,0);
