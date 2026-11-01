import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
import {chapterHash,chapterCollections} from '../lib/practice-chapters.ts';
const base=process.env.KLINK_TEST_URL||'http://127.0.0.1:18984',out=process.env.KLINK_TEST_OUTPUT;
assert(out);mkdirSync(out,{recursive:true});
const grammar=chapterCollections('content-grammatica').filter(c=>c.exercises[0].contentTask.teacherWorkflow?.phases[0].learnerText[2]?.startsWith('1. '));
const spelling=chapterCollections('content-spelling').filter(c=>c.exercises[0].contentTask.teacherWorkflow?.kind==='spelling');
const samples=[...['a1','a2','b1'].map(level=>grammar.find(c=>c.level===level)),grammar.find(c=>c.exercises[0].contentTask.teacherWorkflow.phases[0].learnerText[2].includes('\n4. ')),...['alfa-c','a1','a2','b1'].map(level=>spelling.find(c=>c.level===level))];
assert(samples.every(Boolean));
const results=[];
for(const [engineName,engine]of Object.entries({chromium,webkit})){
 const browser=await engine.launch(),context=await browser.newContext({hasTouch:true});try{
  for(const width of [1366,390,320])for(const theme of ['light','dark'])for(const collection of samples){
   const task=collection.exercises[0].contentTask,spell=task.teacherWorkflow.kind==='spelling';
   const page=await context.newPage(),errors=[];await page.setViewportSize({width,height:width===320?568:950});await page.emulateMedia({colorScheme:theme});
   page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(theme=>{localStorage.clear();localStorage.setItem('taalroute-klink-appearance-v1',theme);},theme);
   const hash=chapterHash({chapter:spell?'spelling':'grammar',activity:spell?'content-spelling':'content-grammatica',collection:collection.id,level:collection.level,help:'guided'});
   await page.goto(base+'/'+hash);await page.getByRole('button',{name:'Begin samen',exact:true}).click();
   const steps=page.locator(spell?'.cp-guided-instructions li':'.cp-instruction-step');
   const count=spell?task.teacherWorkflow.phases[0].instruction.replaceAll('op papier','in het invulvak').split(/(?<=[.!?])\s+/).length:(task.teacherWorkflow.phases[0].learnerText[2].match(/^\d+\. /gm)||[]).length;
   assert.equal(await steps.count(),count);assert.equal(await page.locator('.cp-instruction-number').count(),count);
   assert.equal(await page.locator('html').getAttribute('data-theme'),theme);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   for(const step of await steps.all()){
    const box=await step.boundingBox();assert(box.width>100);
    const colors=await step.evaluate(e=>({background:getComputedStyle(e).backgroundColor,paper:getComputedStyle(e.closest('.cp-exercise-stage')).backgroundColor,number:getComputedStyle(e.querySelector('.cp-instruction-number')).backgroundColor,radius:getComputedStyle(e.querySelector('.cp-instruction-number')).borderRadius}));
    assert.notEqual(colors.background,colors.paper);assert.notEqual(colors.number,colors.background);assert.equal(colors.radius,'50%');
   }
   await steps.last().evaluate(e=>e.scrollIntoView({block:'center'}));assert(await steps.last().isVisible());
   if(spell){const sourceBox=await page.locator('.cp-workflow-source').boundingBox(),stageBox=await page.locator('.cp-exercise-stage').boundingBox();if(width<821)assert(sourceBox.width>=stageBox.width-40,'The source keeps the full reading width');assert.equal(await page.locator('.cp-workflow-source').innerText(),task.teacherWorkflow.phases[0].learnerText.join('\n\n'));assert.equal(await page.locator('.cp-instruction-example').count(),0);}
   assert.deepEqual(errors,[]);
   if(engineName==='chromium'&&theme==='light'&&width!==320){await steps.first().evaluate(e=>e.scrollIntoView({block:'start'}));await page.screenshot({animations:'disabled',path:`${out}/${spell?'spelling':'grammatica'}-${collection.level}-${count}-${width}.png`});}
   results.push({engine:engineName,width,theme,collection:collection.id,steps:count,kind:spell?'spelling':'grammar',sourceTextUntouched:spell,numberedCards:true,overflow:false,errors});await page.close();
  }
 }finally{await browser.close();writeFileSync(out+'/sections-checks.json',JSON.stringify(results,null,2));}
}
assert.equal(results.length,96);console.log('PASS '+results.length+' instruction card, source text and responsive checks');
