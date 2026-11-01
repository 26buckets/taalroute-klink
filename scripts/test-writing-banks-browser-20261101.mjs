import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
import {chapterHash} from '../lib/practice-chapters.ts';
import {groupSessionKey} from '../lib/group-practice.ts';
import {collectionProgressId,roundProgressPrefix} from '../lib/round-progress.ts';
const base=process.env.KLINK_TEST_BASE||'http://127.0.0.1:19041',out=process.env.KLINK_TEST_OUTPUT||'docs/writing-banks-20261101/local';mkdirSync(out,{recursive:true});
const json=f=>JSON.parse(readFileSync(f)),manifest=json('docs/writing-banks-20261101/batch-01.json'),index=json('data/klink-production-index.json');
const checks=[],preservation=[],sessionRecovery=[],errors=[],smoke=!!process.env.KLINK_WRITING_SMOKE;
const route=r=>'/'+chapterHash({chapter:'writing',activity:'copy',collection:r.id,level:r.level,help:r.help});
const oldSessionKey=groupSessionKey('chapter:copy:'+manifest.rows[0].id,'copy');
const oldSession=JSON.stringify({version:1,exerciseId:'KSW-AC-TN-100',done:true});
const oldKey=roundProgressPrefix+collectionProgressId('copy',manifest.rows[0].id,manifest.preservedLegacyUrl);
async function geometry(p){await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(250);await p.evaluate(()=>window.scrollTo(0,0));return p.evaluate(()=>Object.fromEntries(['.cp-task-card','.cp-task-prompt','.cp-text-entry input','[data-practice-check]','[data-practice-next]'].map(s=>{const e=document.querySelector(s),r=e.getBoundingClientRect(),c=getComputedStyle(e);return[s,{x:r.x,y:r.y,width:r.width,height:r.height,font:c.fontFamily,size:c.fontSize,weight:c.fontWeight,color:c.color,background:c.backgroundColor}];})));}
try{
for(const[engine,type]of Object.entries({chromium,webkit})){
 const browser=await type.launch({headless:true,...(engine==='chromium'?{channel:'chrome'}:{})});
 try{for(const width of(smoke?[390]:[1280,390]))for(const theme of(smoke?['light']:['light','dark'])){
  const context=await browser.newContext({viewport:{width,height:844},colorScheme:theme,hasTouch:width<800});const p=await context.newPage();p.on('pageerror',e=>errors.push({engine,width,theme,url:p.url(),message:e.message,stack:e.stack}));
  await context.addInitScript(({oldKey,oldSessionKey,oldSession})=>{if(!localStorage.getItem('writing-test-seeded')){localStorage.setItem(oldSessionKey,oldSession);localStorage.setItem(oldKey,JSON.stringify({version:1,total:20,done:['KSW-AC-TN-081','KSW-AC-TN-020']}));localStorage.setItem('klink.round-progress.v1:unrelated','{"version":1,"total":2,"done":["keep"]}');localStorage.setItem('writing-test-seeded','yes');}localStorage.setItem('klink.exercise-view.v1','{"photo":false,"text":false}');},{oldKey,oldSessionKey,oldSession});
  await p.goto(base+route(manifest.rows[0]),{waitUntil:'networkidle'});await p.locator('[data-exercise-id="KSW-AC-TN-097"]').waitFor();
  for(const row of manifest.rows){const bank=json('public'+row.url);const targets=bank.exercises.filter(e=>manifest.newUniqueSourceIds.includes(e.exerciseId));await p.goto(base+route(row),{waitUntil:'networkidle'});
   for(const [targetIndex,e] of targets.entries()){await p.locator(`[data-exercise-id="${e.exerciseId}"]`).waitFor();
    const input=p.locator('.cp-text-entry input');assert.equal(await p.locator('.cp-task-prompt strong').innerText(),e.exampleWord);assert(await p.locator('.cp-task-prompt strong').isVisible());
    await input.fill(e.exampleWord+'x');await input.press('Enter');assert((await p.locator('.cp-exercise-feedback output').innerText()).includes('Probeer opnieuw'));assert(await p.locator('[data-practice-next]').isDisabled());
    await input.fill(e.exampleWord);await input.press('Enter');await p.locator('[data-practice-ready="true"]').waitFor();
    assert.equal(await p.evaluate(()=>localStorage.getItem('klink.round-progress.v1:unrelated')),'{"version":1,"total":2,"done":["keep"]}');
    assert.equal(await p.evaluate(key=>localStorage.getItem(key),oldSessionKey),oldSession);
    const retained=await p.evaluate(key=>JSON.parse(localStorage.getItem(key)).done,oldKey);assert(retained.includes('KSW-AC-TN-081')&&retained.includes('KSW-AC-TN-020'));
    await p.waitForLoadState('networkidle');checks.push({engine,width,theme,id:e.exerciseId,wrongRejected:true,correctAccepted:true,progressPreserved:true,oldSessionPreserved:true});if(targetIndex<targets.length-1){await p.locator('[data-practice-next]').click();await p.locator(`[data-exercise-id="${targets[targetIndex+1].exerciseId}"]`).waitFor();}
   }
  }
  const revised=manifest.rows[0],key=groupSessionKey('chapter:copy:'+revised.id,'copy',collectionProgressId('copy',revised.id,revised.url));
  await p.evaluate(key=>localStorage.setItem(key,JSON.stringify({version:1,exerciseId:'KSW-AC-TN-100',done:true})),key);await p.goto(base+route(revised),{waitUntil:'networkidle'});await p.locator('.honest-empty').getByRole('button',{name:'Nog een keer',exact:true}).click();await p.locator('[data-exercise-id="KSW-AC-TN-081"]').waitFor();assert.equal(await p.evaluate(key=>localStorage.getItem(key),oldSessionKey),oldSession);sessionRecovery.push({engine,width,theme,oldSessionPreserved:true,oldCompletionResumedAtCorrection:true,restartStartsAtFirst:true});
  const old=index.find(r=>r.id==='production:copy:alfa-c:KSW-AC-TN-001-020'),first=json('public'+old.url).exercises[0];const local=await context.newPage(),live=await context.newPage();
  await local.goto(base+route(old),{waitUntil:'domcontentloaded'});await live.goto('https://klink.taalroute.nl'+route(old),{waitUntil:'domcontentloaded'});for(const page of[local,live]){await page.locator(`[data-exercise-id="${first.exerciseId}"]`).waitFor();await page.evaluate(()=>document.fonts.ready);}
  assert.deepEqual(await geometry(local),await geometry(live));preservation.push({engine,width,theme,geometryEqual:true,oldProgressRetained:true});
  console.log(engine,width,theme,checks.length,'PASS');await local.screenshot({path:`${out}/${engine}-${width}-${theme}.png`});await context.close();
 }}finally{await browser.close();}
}
assert.equal(checks.length,manifest.newUniqueSourceIds.length*(smoke?2:8));assert.equal(preservation.length,smoke?2:8);assert.deepEqual(errors,[]);
}catch(e){errors.push(e.stack);throw e;}finally{writeFileSync(out+'/browser.json',JSON.stringify({base,checks,preservation,sessionRecovery,errors,physicalPhoneTested:false,sourceCommit:manifest.baselineSourceCommit},null,2)+'\n');}
console.log(`PASS: ${checks.length} source-bound answer flows; ${preservation.length} unchanged interface comparisons; old round progress retained.`);
