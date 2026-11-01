import assert from 'node:assert/strict';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
import {chapterCollections} from '../lib/practice-chapters.ts';
const base=process.env.KLINK_TEST_URL||'http://127.0.0.1:18996',out=process.env.KLINK_INFO_OUTPUT||'outputs/learner-info-release-20261101/info';mkdirSync(out,{recursive:true});
const activity='content-woordpakketten',id='content:woordpakketten:word-self:b1:b1:choice',row=chapterCollections(activity).find(r=>r.id===id),exercises=row.contentUrl?JSON.parse(readFileSync('public'+row.contentUrl)).exercises:row.exercises,first=exercises[0],correct=first.contentTask.options.find(o=>first.contentTask.correctOptionIds.includes(o.id)).text;
const route='/#learner/chapters/words/content-woordpakketten/'+encodeURIComponent(id)+'?level=b1&help=practice',checks=[],errors=[];
for(const[engine,type]of Object.entries({chromium,webkit})){
 const browser=await type.launch();try{for(const[width,height]of[[1280,720],[390,844],[320,568]])for(const colorScheme of['light','dark']){
  const context=await browser.newContext({viewport:{width,height},hasTouch:true,colorScheme});const page=await context.newPage();page.setDefaultTimeout(20000);page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(({activity,id,exerciseId})=>{localStorage.setItem('klink.group.v1:chapter:'+activity+':'+id+':'+activity,JSON.stringify({version:1,done:false,exerciseId}));if(!localStorage.getItem('klink.taalroute.attempts.v1'))localStorage.setItem('klink.taalroute.attempts.v1','[{"existing":true}]');},{activity,id,exerciseId:first.exerciseId});
  await page.goto(base+route);const root=page.locator('[data-exercise-id]');await root.waitFor();assert.equal(await root.getAttribute('data-exercise-id'),first.exerciseId);
  await page.getByRole('button',{name:correct,exact:true}).tap();await page.getByRole('button',{name:'Controleer',exact:true}).tap();await page.waitForFunction(()=>!document.querySelector('[data-practice-next]')?.disabled);await page.waitForTimeout(150);
  const before=await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage).filter(([k])=>k.includes('attempt')||k.startsWith('klink.group.'))));
  const trigger=page.getByRole('button',{name:'Over deze oefening',exact:true});const theme=await trigger.evaluate(e=>getComputedStyle(e).getPropertyValue('--paper'));
  await trigger.press('Enter');const dialog=page.getByRole('dialog');await dialog.waitFor();await page.waitForFunction(()=>document.activeElement?.getAttribute('aria-label')==='Uitleg sluiten');await page.waitForTimeout(150);
  const layout=await dialog.evaluate(e=>{const r=e.getBoundingClientRect();return {fits:r.left>=0&&r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight,noScroll:e.scrollHeight<=e.clientHeight+1,font:parseFloat(getComputedStyle(e).fontSize),paper:getComputedStyle(e).getPropertyValue('--paper'),targets:[...e.querySelectorAll('button')].every(b=>{const q=b.getBoundingClientRect();return q.width>=44&&q.height>=44;})};});assert(layout.fits&&layout.noScroll&&layout.targets&&layout.font>=16,JSON.stringify({engine,width,height,colorScheme,layout}));assert.equal(layout.paper,theme);
  assert.equal(await dialog.getByText(first.contentTask.teacherGuidance,{exact:true}).count(),0);
  for(const key of['Tab','ArrowRight','ArrowLeft']){await page.keyboard.press(key);assert(await dialog.evaluate(e=>e.contains(document.activeElement)));assert.equal(await root.getAttribute('data-exercise-id'),first.exerciseId);}
  await page.screenshot({path:`${out}/${engine}-${width}-${colorScheme}.png`});await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});await page.waitForFunction(()=>document.activeElement?.getAttribute('aria-label')==='Over deze oefening');
  assert.equal(await page.getByRole('button',{name:correct,exact:true}).getAttribute('aria-pressed'),'true');assert(await page.locator('[data-practice-next]').isEnabled());
  for(const[k,v]of Object.entries(before))assert.deepEqual(JSON.parse(await page.evaluate(k=>localStorage.getItem(k),k)),JSON.parse(v));
  await trigger.press(' ');await dialog.waitFor();await page.getByRole('button',{name:'Terug naar de oefening',exact:true}).tap();await dialog.waitFor({state:'hidden'});
  await page.reload();await root.waitFor();for(const[k,v]of Object.entries(before))assert.deepEqual(JSON.parse(await page.evaluate(k=>localStorage.getItem(k),k)),JSON.parse(v));
  assert.equal(await page.getByRole('button',{name:'Hulp met je docent',exact:true}).count(),0);
  checks.push({engine,width,height,colorScheme,...layout,focusRestored:true,keyboardContained:true,answerPreserved:true,progressPreserved:true,reloadPreserved:true,teacherNotesPrivate:true,oldButtonRemoved:true});await context.close();
 }}finally{await browser.close();writeFileSync(out+'/checks.json',JSON.stringify({base,checks,errors,physicalPhoneTested:false},null,2)+'\n');}
}
assert.equal(checks.length,12);assert.deepEqual(errors,[]);console.log('PASS 12 learner-info keyboard/touch/theme/answer/progress checks');
