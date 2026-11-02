import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
import {chapterHash} from '../lib/practice-chapters.ts';
import {groupSessionKey} from '../lib/group-practice.ts';
import {collectionProgressId} from '../lib/round-progress.ts';
const folder='docs/writing-copy-aa-17-20261102/',base=process.env.KLINK_TEST_BASE||'http://127.0.0.1:19031',out=process.env.KLINK_TEST_OUTPUT||folder+'local';mkdirSync(out+'/screens',{recursive:true});
const row=JSON.parse(readFileSync(folder+'import-manifest.json')).newRows[0].row,e=JSON.parse(readFileSync('public'+row.url)).exercises[1],checks=[],errors=[];
try{for(const[engine,type]of Object.entries({chromium,webkit})){
 const browser=await type.launch({headless:true,...(engine==='chromium'?{channel:'chrome'}:{})});
 try{for(const width of[1280,390,320])for(const theme of['light','dark']){
  const page=await browser.newPage({viewport:{width,height:width===320?568:844}});page.on('pageerror',error=>errors.push({engine,width,theme,message:error.message}));
  await page.goto(base);await page.evaluate(({theme,key,id})=>{window.TaalrouteAppearance.set(theme);localStorage.setItem(key,JSON.stringify({version:1,exerciseId:id,done:false}));},{theme,key:groupSessionKey('chapter:copy:'+row.id,'copy',collectionProgressId('copy',row.id,row.url)),id:e.exerciseId});
  await page.goto('about:blank');await page.goto(base+'/'+chapterHash({chapter:'writing',activity:'copy',collection:row.id,level:'alfa-a',help:'guided'}));const task=page.locator(`[data-exercise-id="${e.exerciseId}"]`);await task.waitFor();await page.waitForFunction(()=>document.querySelector('.cp-text-entry input')?.disabled===false);
  const automatic=page.locator('[data-practice-automatic]');if(await automatic.getAttribute('aria-pressed')==='false')await automatic.click();assert.equal(await page.locator('html').getAttribute('data-theme'),theme);
  for(const state of['question','wrong']){
   if(state==='wrong'){await task.getByRole('textbox',{name:'Jouw antwoord',exact:true}).fill('A');await task.getByRole('button',{name:'Controleer',exact:true}).click();assert((await page.locator('.cp-exercise-feedback').innerText()).includes(e.feedback));}
   assert.equal(await task.locator('.cp-task-prompt strong').innerText(),'a');const modelVisible=await task.locator('.cp-task-prompt strong').isVisible(),inputVisible=await task.getByRole('textbox',{name:'Jouw antwoord',exact:true}).isVisible();const box=await page.evaluate(()=>({viewport:innerWidth,scroll:document.documentElement.scrollWidth,input:document.querySelector('.cp-text-entry input').getBoundingClientRect().toJSON()}));assert(box.scroll<=box.viewport+1&&box.input.x>=0&&box.input.right<=width+1);assert(modelVisible&&inputVisible);
   await page.screenshot({path:`${out}/screens/${engine}-${width}-${theme}-${state}.png`,fullPage:true});checks.push({engine,width,theme,state,sourceId:e.exerciseId,noHorizontalOverflow:true,modelVisible,inputVisible});
  }
  await page.close();
 }}finally{await browser.close();}
}}finally{writeFileSync(out+'/layout.json',JSON.stringify({base,checks,errors},null,2)+'\n');}
assert.equal(checks.length,24);assert.deepEqual(errors,[]);console.log('Passed:24 actual copy-model/input/feedback layouts at1280/390/320,light/dark,Chromium/WebKit.');
