import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
import {chapterHash} from '../lib/practice-chapters.ts';
import {collectionProgressId,roundProgressPrefix} from '../lib/round-progress.ts';
const base=process.env.KLINK_TEST_BASE||'http://127.0.0.1:19031';
const out=process.env.KLINK_TEST_OUTPUT||'docs/writing-copy-next-20261101/local';mkdirSync(out,{recursive:true});
const index=JSON.parse(readFileSync('data/klink-production-index.json'));
const rows=index.filter(r=>r.id.startsWith('production:copy:alfa-c:KSW-AC-TN-'));assert.equal(rows.length,5);
const route=r=>'/'+chapterHash({chapter:'writing',activity:'copy',collection:r.id,level:r.level,help:r.help});
const checks=[],preserved=[],errors=[];
function seed(){
  if(!localStorage.getItem('klink.taalroute.attempts.v1'))localStorage.setItem('klink.taalroute.attempts.v1','[{"existing":true}]');
  localStorage.setItem('klink.exercise-view.v1','{"photo":false,"text":false}');
  localStorage.setItem('klink.round-progress.v1:previous-round','{"version":1,"total":2,"done":["old-task"]}');
}
async function ready(p,id){await p.locator(`[data-exercise-id="${id}"]`).waitFor();}
async function visibleModel(p,e){
  const model=p.locator('.cp-task-prompt strong');assert.equal(await model.innerText(),e.exampleWord);assert(await model.isVisible());
  assert.equal(await model.getAttribute('aria-hidden'),null);
}
async function geometry(p){
  await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(200);
  return p.evaluate(()=>Object.fromEntries(['.cp-task-card','.cp-task-prompt','.cp-text-entry input','[data-practice-check]','[data-practice-next]'].map(s=>{
    const e=document.querySelector(s);if(!e)return[s,null];const r=e.getBoundingClientRect(),c=getComputedStyle(e);
    return[s,{x:r.x,y:r.y,width:r.width,height:r.height,font:c.fontFamily,size:c.fontSize,weight:c.fontWeight,color:c.color,background:c.backgroundColor,border:c.borderRadius}];
  })));
}
try{
for(const[engine,type]of Object.entries({chromium,webkit})){
  const browser=await type.launch({headless:true,...(engine==='chromium'?{channel:'chrome'}:{})});
  try{
  for(const[width,height]of[[1280,800],[390,844],[320,568]])for(const theme of['light','dark']){
    const context=await browser.newContext({viewport:{width,height},colorScheme:theme,hasTouch:width<800});await context.addInitScript(seed);
    const p=await context.newPage();p.on('pageerror',e=>errors.push({engine,width,theme,error:e.message}));
    const priorProgress=new Map();let writtenAttempts=0;
    for(const row of rows){
    const exercises=JSON.parse(readFileSync('public'+row.url)).exercises;
    const progressKey=roundProgressPrefix+collectionProgressId('copy',row.id,row.url);
    await p.goto(base+route(row));await ready(p,exercises[0].exerciseId);
    const auto=p.locator('[data-practice-automatic]');if(await auto.count()&&await auto.getAttribute('aria-pressed')==='false')await auto.click();
    for(const[i,e]of exercises.entries()){
      await ready(p,e.exerciseId);await visibleModel(p,e);
      const input=p.locator('.cp-text-entry input'),next=p.locator('[data-practice-next]');
      assert(await next.isDisabled());
      const t=e.exampleWord,n=Array.from(t).length,ends=/[.!?]$/.test(t);
      const wrong=[[t+'x',n+1],[t[0]===t[0].toUpperCase()?t[0].toLowerCase()+t.slice(1):t[0].toUpperCase()+t.slice(1),1],[ends?t.slice(0,-1):t+'.',ends?n:n+1]];
      if(t.includes(' '))wrong.push([t.replace(' ','  '),t.indexOf(' ')+2]);
      for(const[value,position]of wrong){await input.fill(value);await input.press('Enter');const feedback=await p.locator('.cp-exercise-feedback output').innerText();assert(feedback.includes('Probeer opnieuw'));assert(feedback.includes(`Kijk bij teken ${position}.`));assert(feedback.includes(e.feedback));assert(await next.isDisabled());}
      await input.fill('  '+e.exampleWord+'  ');await input.press('Enter');await p.locator('[data-practice-ready="true"]').waitFor();await visibleModel(p,e);assert(await next.isEnabled());
      writtenAttempts+=wrong.length+1;
      const rect=await next.boundingBox();assert(rect.width>=44&&rect.height>=44);assert(rect.x>=0&&rect.x+rect.width<=width+1);
      checks.push({engine,width,height,theme,collection:row.id,id:e.exerciseId,wrongAnswersRejected:wrong.length,firstDifferenceExplained:true,individualHintPreserved:true,outerWhitespaceAccepted:true,modelAlwaysVisible:true,keyboardCheck:true,nextFits:true});
      await next.click();
      if(i===4){await ready(p,exercises[5].exerciseId);await p.reload();await ready(p,exercises[5].exerciseId);const auto=p.locator('[data-practice-automatic]');if(await auto.count()&&await auto.getAttribute('aria-pressed')==='false')await auto.click();}
    }
    await p.waitForFunction(key=>JSON.parse(localStorage.getItem(key)||'null')?.done?.length===20,progressKey);
    assert.equal(await p.evaluate(()=>localStorage.getItem('klink.round-progress.v1:previous-round')),'{"version":1,"total":2,"done":["old-task"]}');
    const attempts=await p.evaluate(()=>JSON.parse(localStorage.getItem('klink.taalroute.attempts.v1')));
    assert.equal(attempts.length,Math.min(200,writtenAttempts+1));
    assert.equal(attempts.some(a=>a.existing),writtenAttempts<200,'Preserve the existing 200-attempt rotation rule');
    await p.reload();assert.equal((await p.evaluate(key=>JSON.parse(localStorage.getItem(key)).done,progressKey)).length,20);
    for(const[key,value]of priorProgress)assert.equal(await p.evaluate(key=>localStorage.getItem(key),key),value,'A later round must preserve earlier completion');
    priorProgress.set(progressKey,await p.evaluate(key=>localStorage.getItem(key),progressKey));
    }
    await context.close();console.log(engine,width,theme,'100 source positions PASS');
  }
  // Compare the unchanged player, including its original forgiving answer policy.
  const old=index.find(r=>r.id==='production:copy:alfa-c:WBG-C-01');const e=JSON.parse(readFileSync('public'+old.url)).exercises[0];
  for(const width of[1280,390])for(const theme of['light','dark']){
    const context=await browser.newContext({viewport:{width,height:844},colorScheme:theme});
    const pages=await Promise.all([context.newPage(),context.newPage()]);
    for(const[p,url]of /** @type {const} */ ([[pages[0],base],[pages[1],'https://klink.taalroute.nl']])){await p.goto(url+route(old));await ready(p,e.exerciseId);}
    const[g1,g2]=await Promise.all(pages.map(geometry));
    assert.deepEqual(g1,g2,`${engine} ${width} ${theme}: existing player appearance`);
    const input=pages[0].locator('.cp-text-entry input');await input.fill(e.exampleWord.toUpperCase().replace(/[.!?]+$/,''));await input.press('Enter');await pages[0].locator('[data-practice-ready="true"]').waitFor();
    preserved.push({engine,width,theme,existingPlayerGeometryAndStyleIdentical:true,oldAnswerPolicyPreserved:true});await context.close();
  }
  }finally{await browser.close();}
}
assert.equal(checks.length,1200);assert.equal(preserved.length,8);assert.deepEqual(errors,[]);
}catch(e){errors.push({testFailure:e.stack});throw e;}finally{writeFileSync(out+'/browser-checks.json',JSON.stringify({base,checks,preserved,errors,physicalPhoneTested:false,audioRequired:false},null,2)+'\n');}
console.log('PASS: 1200 task flows with exact difference feedback; 8 existing appearance and grading comparisons; saved progress preserved.');
