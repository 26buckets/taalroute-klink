import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
import {chapterHash} from '../lib/practice-chapters.ts';
import {collectionProgressId,roundProgressPrefix} from '../lib/round-progress.ts';
const base=process.env.KLINK_TEST_BASE||'http://127.0.0.1:19031';
const out=process.env.KLINK_TEST_OUTPUT||'docs/writing-copy-20261101/local';mkdirSync(out,{recursive:true});
const index=JSON.parse(readFileSync('data/klink-production-index.json'));
const row=index.find(r=>r.id==='production:copy:alfa-c:KSW-AC-TN-001-020');
const exercises=JSON.parse(readFileSync('public'+row.url)).exercises;
const route=r=>'/'+chapterHash({chapter:'writing',activity:'copy',collection:r.id,level:r.level,help:r.help});
const progressKey=roundProgressPrefix+collectionProgressId('copy',row.id,row.url);
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
    await p.goto(base+route(row));await ready(p,exercises[0].exerciseId);
    const auto=p.locator('[data-practice-automatic]');if(await auto.count()&&await auto.getAttribute('aria-pressed')==='false')await auto.click();
    for(const[i,e]of exercises.entries()){
      await ready(p,e.exerciseId);await visibleModel(p,e);
      const input=p.locator('.cp-text-entry input'),next=p.locator('[data-practice-next]');
      assert(await next.isDisabled());
      const wrong=[e.exampleWord+'x',e.exampleWord[0]===e.exampleWord[0].toUpperCase()?e.exampleWord[0].toLowerCase()+e.exampleWord.slice(1):e.exampleWord[0].toUpperCase()+e.exampleWord.slice(1),e.exampleWord.endsWith('.')?e.exampleWord.slice(0,-1):e.exampleWord+'.'];
      if(e.exampleWord.includes(' '))wrong.push(e.exampleWord.replace(' ','  '));
      for(const value of wrong){await input.fill(value);await input.press('Enter');assert((await p.locator('.cp-exercise-feedback output').innerText()).includes('Probeer opnieuw'));assert(await next.isDisabled());}
      await input.fill('  '+e.exampleWord+'  ');await input.press('Enter');await p.locator('[data-practice-ready="true"]').waitFor();await visibleModel(p,e);assert(await next.isEnabled());
      const rect=await next.boundingBox();assert(rect.width>=44&&rect.height>=44);assert(rect.x>=0&&rect.x+rect.width<=width+1);
      checks.push({engine,width,height,theme,id:e.exerciseId,wrongAnswersRejected:wrong.length,outerWhitespaceAccepted:true,modelAlwaysVisible:true,keyboardCheck:true,nextFits:true});
      await next.click();
      if(i===4){await ready(p,exercises[5].exerciseId);await p.reload();await ready(p,exercises[5].exerciseId);const auto=p.locator('[data-practice-automatic]');if(await auto.count()&&await auto.getAttribute('aria-pressed')==='false')await auto.click();}
    }
    await p.waitForFunction(key=>JSON.parse(localStorage.getItem(key)||'null')?.done?.length===20,progressKey);
    assert.equal(await p.evaluate(()=>localStorage.getItem('klink.round-progress.v1:previous-round')),'{"version":1,"total":2,"done":["old-task"]}');
    assert(await p.evaluate(()=>JSON.parse(localStorage.getItem('klink.taalroute.attempts.v1')).some(a=>a.existing)));
    await p.reload();assert.equal((await p.evaluate(key=>JSON.parse(localStorage.getItem(key)).done,progressKey)).length,20);
    await context.close();console.log(engine,width,theme,'20 tasks PASS');
  }
  // Compare the unchanged player, including its original forgiving answer policy.
  const old=index.find(r=>r.id==='production:copy:alfa-c:WBG-C-01');const e=JSON.parse(readFileSync('public'+old.url)).exercises[0];
  for(const width of[1280,390])for(const theme of['light','dark']){
    const context=await browser.newContext({viewport:{width,height:844},colorScheme:theme});
    const pages=await Promise.all([context.newPage(),context.newPage()]);
    for(const[p,url]of[[pages[0],base],[pages[1],'https://klink.taalroute.nl']]){await p.goto(url+route(old));await ready(p,e.exerciseId);}
    const[g1,g2]=await Promise.all(pages.map(geometry));
    assert.deepEqual(g1,g2,`${engine} ${width} ${theme}: existing player appearance`);
    const input=pages[0].locator('.cp-text-entry input');await input.fill(e.exampleWord.toUpperCase().replace(/[.!?]+$/,''));await input.press('Enter');await pages[0].locator('[data-practice-ready="true"]').waitFor();
    preserved.push({engine,width,theme,existingPlayerGeometryAndStyleIdentical:true,oldAnswerPolicyPreserved:true});await context.close();
  }
  }finally{await browser.close();}
}
assert.equal(checks.length,240);assert.equal(preserved.length,8);assert.deepEqual(errors,[]);
}catch(e){errors.push({testFailure:e.stack});throw e;}finally{writeFileSync(out+'/browser-checks.json',JSON.stringify({base,checks,preserved,errors,physicalPhoneTested:false,audioRequired:false},null,2)+'\n');}
console.log('PASS: 240 task flows; 8 existing appearance and grading comparisons; saved progress preserved.');
