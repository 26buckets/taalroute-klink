import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
import {chapterHash} from '/tmp/klink-wordspace-20261106/lib/practice-chapters.ts';
const root='/tmp/klink-wordspace-20261106/',out='outputs/postflight-review-20261108',base='https://klink.taalroute.nl';
const row=JSON.parse(readFileSync(root+'docs/handwriting-20261102/import-manifest.json')).newRows[0].row,exercise=JSON.parse(readFileSync(root+'public'+row.url)).exercises[0],id=exercise.exerciseId;
const url=base+'/'+chapterHash({chapter:'writing',activity:'paper-dictation',collection:row.id,level:'alfa-c',help:'practice'});
const checks=[],errors=[];
async function stored(page){return page.evaluate(id=>new Promise((resolve,reject)=>{const r=indexedDB.open('klink-writing-ink-v1',1);r.onsuccess=()=>{const db=r.result,t=db.transaction('answers'),q=t.objectStore('answers').get(id);t.oncomplete=()=>{resolve(q.result);db.close()};t.onerror=()=>reject(t.error)};r.onerror=()=>reject(r.error)}),id)}
async function until(page,test){for(let i=0;i<60;i++){const r=await stored(page);if(test(r))return r;await page.waitForTimeout(50)}throw Error('Expected saved ink not committed')}
for(const [engine,type] of Object.entries({chromium,webkit})){
 const browser=await type.launch();try{for(const width of [1280,390]){
 const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'}),page=await context.newPage();page.on('pageerror',e=>errors.push({engine,width,message:e.message}));
 await page.goto(url);const task=page.locator(`[data-handwriting-source="${id}"]`),svg=task.locator('.kpd-writing');await task.waitFor();
 async function listen(){const b=page.locator('button.cp-exercise-listen');await b.click();await page.waitForFunction(()=>document.querySelector('.kpd-writing')?.getAttribute('aria-disabled')!=='true')}
 async function draw(offset){await svg.scrollIntoViewIfNeeded();const b=await svg.boundingBox();assert(b?.width>0);await page.mouse.move(b.x+b.width*offset,b.y+b.height*.25);await page.mouse.down();await page.mouse.move(b.x+b.width*(offset+.15),b.y+b.height*.65,{steps:5});await page.mouse.up()}
 await listen();await draw(.2);await until(page,r=>r?.draft?.[0]?.length>1);await task.getByRole('button',{name:'Vergelijk',exact:true}).click();await task.getByRole('button',{name:'Ik heb vergeleken',exact:true}).waitFor();const before=await until(page,r=>r?.first?.length&&r?.last?.length);
 const points=await svg.locator('polyline').evaluateAll(es=>es.map(e=>e.getAttribute('points')));assert(points.length>0);
 await page.reload();await task.waitFor();await page.waitForFunction(()=>document.querySelector('[data-handwriting-source] .kpd-writing polyline'));
 assert.deepEqual(await stored(page),before,'All stored ink and history unchanged after reload');assert.deepEqual(await svg.locator('polyline').evaluateAll(es=>es.map(e=>e.getAttribute('points'))),points,'Visible strokes restored exactly');
 await listen();await draw(.55);await until(page,r=>JSON.stringify(r?.draft)!==JSON.stringify(before.draft));await task.getByRole('button',{name:'Vergelijk',exact:true}).click();const after=await until(page,r=>JSON.stringify(r?.last)!==JSON.stringify(before.last));assert.deepEqual(after.first,before.first,'First submission remains unchanged');
 const release=await page.evaluate(async()=>await(await fetch('/release.json')).json());assert.equal(release.sourceCommit,'99908642b4ec39b31fdeb68ce7c591271259e77e');
 await page.screenshot({path:`${out}/ink-${engine}-${width}.png`,fullPage:true});checks.push({engine,width,sourceCommit:release.sourceCommit,realIndexedDB:true,actualPointerDrawing:true,exactRecordRetainedOnReload:true,visibleStrokesRetained:true,firstAnswerRetainedAfterNewSave:true,newSaveWorks:true,simulatedAudio:false});await context.close();
 }}finally{await browser.close();writeFileSync(out+'/ink-reload.json',JSON.stringify({checks,errors,physicalDevice:false},null,2)+'\n')}
}
assert.equal(checks.length,4);assert.deepEqual(errors,[]);console.log('PASS four live handwriting reload/new-save checks across Chromium/WebKit and desktop/mobile sizes');
