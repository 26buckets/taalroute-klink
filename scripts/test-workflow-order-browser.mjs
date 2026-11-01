import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
import {chapterCollections,chapterHash} from '../lib/practice-chapters.ts';
const base=process.env.KLINK_TEST_URL||'http://127.0.0.1:18984',out=process.env.KLINK_TEST_OUTPUT;
assert(out);mkdirSync(out,{recursive:true});
const reproduce=process.env.KLINK_REPRODUCE==='1';
const samples=[
 chapterCollections('content-grammatica').find(c=>c.exercises[0]?.contentTask?.id==='kg-b1-g62-001'),
 chapterCollections('content-spelling').find(c=>c.level==='b1'&&c.exercises[0]?.contentTask?.teacherWorkflow?.kind==='spelling'),
];assert(samples.every(Boolean));
const checks=[];
function keyboard(){const v=new EventTarget();v.height=innerHeight;v.offsetTop=0;Object.defineProperty(window,'visualViewport',{configurable:true,value:v});window.workflowKeyboard=(height)=>{v.height=height;v.dispatchEvent(new Event('resize'));};}
async function order(page){
 const selectors=['.cp-workflow-controls','.cp-workflow-source','.cp-text-entry','button[aria-pressed]','[data-practice-step-next]'];
 const geometry=await page.locator('.cp-teacher-workflow').evaluate((root,selectors)=>{const parent=root.getBoundingClientRect();return selectors.map(selector=>{const e=root.querySelector(':scope > '+selector);if(!e)throw new Error(selector);const r=e.getBoundingClientRect();return {selector,top:r.top-parent.top,bottom:r.bottom-parent.top,width:r.width,left:r.left-parent.left};});},selectors);
 for(let i=1;i<geometry.length;i++)assert(geometry[i].top>=geometry[i-1].bottom-1,JSON.stringify(geometry));
 assert(geometry[2].width>=geometry[1].width-2,'Answer uses the same reading width as the task');
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 return geometry;
}
for(const [name,engine]of Object.entries(reproduce?{chromium}:{chromium,webkit})){
 const browser=await engine.launch(),context=await browser.newContext();try{
 for(const width of reproduce?[748]:[320,390,748,820,821,1366])for(const theme of reproduce?['dark']:['light','dark'])for(const collection of reproduce?samples.slice(0,1):samples){
  const task=collection.exercises[0].contentTask,spelling=task.teacherWorkflow.kind==='spelling';
  const page=await context.newPage(),errors=[];await page.setViewportSize({width,height:width===748?768:950});await page.emulateMedia({colorScheme:theme});page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(theme=>{if(!sessionStorage.getItem('workflow-order-initialized')){localStorage.clear();sessionStorage.setItem('workflow-order-initialized','true');localStorage.setItem('taalroute-klink-appearance-v1',theme);localStorage.setItem('workflow-order-sentinel','behouden');}},theme);await page.addInitScript(keyboard);
  await page.goto(base+'/'+chapterHash({chapter:spelling?'spelling':'grammar',activity:spelling?'content-spelling':'content-grammatica',collection:collection.id,level:collection.level,help:'guided'}));await page.getByRole('button',{name:'Begin samen',exact:true}).click();
  if(reproduce)await page.screenshot({path:out+'/before-748.png'});
  const geometry=await order(page);
  const input=page.getByRole('textbox',{name:'Je antwoord',exact:true}),done=page.getByRole('button',{name:'Ik heb deze stap uitgevoerd',exact:true}),next=page.getByRole('button',{name:'Samen bekijken',exact:true});
  assert(await next.isDisabled());assert(await page.locator('[data-view-toggle="photo"]').isDisabled());
  const toggle=page.locator('[data-view-toggle="text"]');await toggle.click();assert(await page.locator('[data-view-content="text"]').evaluateAll(nodes=>nodes.length>0&&nodes.every(e=>getComputedStyle(e).visibility==='hidden'&&e.hasAttribute('inert'))));assert(await input.isVisible());if(!spelling)assert(await page.locator('.cp-instruction-step').first().isVisible());assert.deepEqual(await order(page),geometry);await toggle.click();
  await input.fill('Mijn eerste antwoord blijft bewaard.');assert(await next.isDisabled());
  if(width<=820){await page.evaluate(()=>window.workflowKeyboard(350));await page.locator('.learner-main[data-keyboard-open="true"]').waitFor();await input.scrollIntoViewIfNeeded();await order(page);assert(await input.evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=350;}));await page.evaluate(()=>window.workflowKeyboard(innerHeight));await input.press('Tab');}
  await done.click();assert(await next.isEnabled());
  await page.getByRole('button',{name:'Voor de docent',exact:true}).click();assert.equal(await page.getByRole('heading',{name:'Docenthandeling',exact:true}).count(),0);await page.getByRole('button',{name:'Terug naar de opdracht',exact:true}).click();assert.equal(await input.inputValue(),'Mijn eerste antwoord blijft bewaard.');
  await page.reload();await page.getByRole('button',{name:'Terug naar de opdracht',exact:true}).click();assert.equal(await input.inputValue(),'Mijn eerste antwoord blijft bewaard.');assert.equal(await page.getByRole('button',{name:'Deze stap is uitgevoerd',exact:true}).getAttribute('aria-pressed'),'true');assert(await next.isEnabled());await order(page);
  if(name==='chromium'&&theme==='dark'&&[390,748,1366].includes(width)){await page.locator('.cp-workflow-controls').scrollIntoViewIfNeeded();await page.screenshot({path:`${out}/${spelling?'spelling':'grammatica'}-${width}-top.png`});await input.scrollIntoViewIfNeeded();await page.screenshot({path:`${out}/${spelling?'spelling':'grammatica'}-${width}-antwoord.png`});}
  await next.click();if(spelling)await page.getByRole('heading',{name:'Bekijk het samen',exact:true}).waitFor();else{assert.equal(await page.getByRole('heading',{name:'Beoordelingsreferentie',exact:true}).count(),0);await page.getByRole('button',{name:'De cursist kijkt niet mee',exact:true}).click();await page.getByRole('heading',{name:'Beoordelingsreferentie',exact:true}).waitFor();}
  assert.equal(await page.evaluate(()=>localStorage.getItem('workflow-order-sentinel')),'behouden');assert.deepEqual(errors,[]);
  checks.push({engine:name,width,theme,kind:task.teacherWorkflow.kind,sourceThenAnswerThenConfirmation:true,fullWidthAnswer:true,textToggleKeepsGeometry:true,teacherPrivacy:true,answerAndConfirmationSurviveReload:true,simulatedKeyboard:width<=820,reviewAccessible:true,errors});await page.close();
 }
 }finally{await browser.close();writeFileSync(out+'/checks.json',JSON.stringify(checks,null,2)+'\n');}
}
assert.equal(checks.length,reproduce?1:48);console.log('PASS '+checks.length+' complete workflow order/privacy/answer checks');
