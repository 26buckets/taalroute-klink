import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
import {chapterHash} from '../lib/practice-chapters.ts';
const folder='docs/handwriting-20261102/',base=process.env.KLINK_TEST_BASE||'http://127.0.0.1:19031',out=process.env.KLINK_TEST_OUTPUT||folder+'local';mkdirSync(out,{recursive:true});
const row=JSON.parse(readFileSync(folder+'import-manifest.json')).newRows[0].row,e=JSON.parse(readFileSync('public'+row.url)).exercises[0],route=base+'/'+chapterHash({chapter:'writing',activity:'paper-dictation',collection:row.id,level:'alfa-c',help:'practice'}),checks=[],errors=[];
async function raw(page,id=e.exerciseId,value){
 return page.evaluate(({id,value})=>new Promise((resolve,reject)=>{
  const request=indexedDB.open('klink-writing-ink-v1',1);request.onupgradeneeded=()=>request.result.createObjectStore('answers');
  request.onsuccess=()=>{const db=request.result,t=db.transaction('answers',value===undefined?'readonly':'readwrite'),r=value===undefined?t.objectStore('answers').get(id):t.objectStore('answers').put(value,id);t.oncomplete=()=>{resolve(value===undefined?r.result:value);db.close();};t.onerror=()=>reject(t.error);};request.onerror=()=>reject(request.error);
 }),{id,value});
}
async function open(context,prepare){
 const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));await page.goto(base);if(prepare)await prepare(page);await page.goto(route);const task=page.locator(`[data-handwriting-source="${e.exerciseId}"]`);await task.waitFor();return{page,task,svg:task.locator('.kpd-writing')};
}
async function play(p){await p.page.locator('[data-practice-listen]').click();await p.page.waitForFunction(()=>document.querySelector('.kpd-writing')?.getAttribute('aria-disabled')!=='true');}
async function draw(p,offset=.18){
 await p.task.locator('.cp-handwriting-input').scrollIntoViewIfNeeded();const b=await p.svg.boundingBox();await p.page.mouse.move(b.x+b.width*offset,b.y+b.height*.25);await p.page.mouse.down();await p.page.mouse.move(b.x+b.width*(offset+.15),b.y+b.height*.65,{steps:5});await p.page.mouse.up();return raw(p.page);
}
async function compare(p){await p.task.getByRole('button',{name:'Vergelijk',exact:true}).click();await p.task.getByRole('button',{name:'Ik heb vergeleken',exact:true}).waitFor();return raw(p.page);}
try{for(const[engine,type]of Object.entries({chromium,webkit})){
 const browser=await type.launch({headless:true,...(engine==='chromium'?{channel:'chrome'}:{})});
 try{
  {
   const c=await browser.newContext({viewport:{width:390,height:844}}),broken={version:99,draft:'Oorspronkelijk onbekend formaat'},p=await open(c,page=>raw(page,e.exerciseId,broken));
   await p.task.getByRole('alert').waitFor();assert.equal(await p.svg.getAttribute('aria-disabled'),'true');assert(await p.task.getByRole('button',{name:'Vergelijk',exact:true}).isDisabled());assert(await p.task.getByRole('button',{name:'Help',exact:true}).isDisabled());assert.deepEqual(await raw(p.page),broken);checks.push({engine,case:'unknown-stored-format',originalRecordNotOverwritten:true});await c.close();
  }
  {
   const c=await browser.newContext({viewport:{width:390,height:844}}),p=await open(c);await play(p);
   // oxlint-disable-next-line typescript/unbound-method -- Preserve the native method so the quota test can restore the prototype exactly.
   await p.page.evaluate(()=>{window.hsOriginalPut=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(...args){if(args[1]==='KSW-AC-HS-001')throw new DOMException('Test storage full','QuotaExceededError');return window.hsOriginalPut.apply(this,args);};});
   await draw(p);await p.task.getByRole('alert').waitFor();await p.task.getByRole('button',{name:'Vergelijk',exact:true}).click();await p.task.getByRole('alert').waitFor();assert.equal(await p.task.locator('.cp-paper-model').count(),0);assert.equal(await raw(p.page),undefined);assert.equal(await p.page.locator('[data-exercise-id]').getAttribute('data-practice-ready'),'false');
   await p.page.evaluate(()=>{IDBObjectStore.prototype.put=window.hsOriginalPut;});const saved=await compare(p);assert(saved.first?.length&&saved.last?.length);assert.equal(await p.task.getByRole('alert').count(),0);checks.push({engine,case:'write-failure-and-retry',simulatedStorageFailure:true,ownInkStayedVisible:true,completionWaitedForRealCommit:true});await c.close();
  }
  {
   const c=await browser.newContext({viewport:{width:390,height:844}}),a=await open(c),b=await open(c);await play(a);await play(b);const original=await draw(a),other=await draw(b,.5);assert.notDeepEqual(original.draft,other.draft);const submitted=await compare(a);await draw(b,.55);assert.deepEqual((await raw(b.page)).first,submitted.first,'A stale second tab must not erase the first submission');const corrected=await compare(b);assert.deepEqual(corrected.first,submitted.first);assert.notDeepEqual(corrected.last,submitted.last);checks.push({engine,case:'two-real-tabs',firstSubmissionImmutableAcrossTabs:true,lastActualSubmissionUpdated:true});await c.close();
  }
  {
   const c=await browser.newContext({viewport:{width:390,height:844}}),p=await open(c);await play(p);const original=await draw(p),points=await p.svg.locator('polyline').getAttribute('points');
   for(const width of[1280,320,390]){await p.page.setViewportSize({width,height:width===320?568:844});assert.deepEqual(await raw(p.page),original);assert.equal(await p.svg.locator('polyline').getAttribute('points'),points);const scale=await p.svg.evaluate(el=>{const m=el.getScreenCTM();return[m.a,m.d];});assert(Math.abs(scale[0]-scale[1])<.001);}
   checks.push({engine,case:'resize',originalCoordinatesAndLetterProportionsRetained:true,widths:[1280,320,390]});await c.close();
  }
  {
   const c=await browser.newContext({viewport:{width:390,height:844}}),p=await open(c);await play(p);await draw(p);await compare(p);await p.task.getByRole('button',{name:'Ik heb vergeleken',exact:true}).click();await p.page.waitForTimeout(4000);assert.equal(await p.page.locator('[data-handwriting-source]').getAttribute('data-handwriting-source'),e.exerciseId);assert.equal(await p.page.locator('[data-practice-automatic]').count(),0);checks.push({engine,case:'explicit-next',noAutomaticAdvanceAfterComparison:true});await c.close();
  }
  {
   const c=await browser.newContext({viewport:{width:390,height:844}}),pattern='**'+e.prompt.audio.src;await c.route(pattern,r=>r.fulfill({status:503,body:''}));const p=await open(c);await p.page.locator('[data-practice-listen]').click();await p.page.locator('.cp-exercise-feedback').filter({hasText:/opnieuw|lukt|geluid/i}).waitFor();assert.equal(await p.svg.getAttribute('aria-disabled'),'true');assert(await p.task.getByRole('button',{name:'Vergelijk',exact:true}).isDisabled());await c.unroute(pattern);await play(p);await draw(p);assert((await compare(p)).first.length);checks.push({engine,case:'actual-http503-and-retry',actualNativeMediaRequestFailed:true,writingStayedLockedUntilPlaybackSucceeded:true});await c.close();
  }
  if(engine==='chromium')for(const pointerType of['touch','pen']){
   const c=await browser.newContext({viewport:{width:390,height:844},hasTouch:true}),p=await open(c);await play(p);await p.svg.scrollIntoViewIfNeeded();const box=await p.svg.boundingBox(),x=box.x+box.width*.2,y=box.y+box.height*.25;await p.svg.evaluate(el=>{window.hsPointers=[];el.addEventListener('pointerdown',e=>window.hsPointers.push({type:e.pointerType,trusted:e.isTrusted,primary:e.isPrimary}));});const cdp=await c.newCDPSession(p.page);
   if(pointerType==='touch'){
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+35,y:y+35,id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x+35,y:y+35,id:1},{x:x+80,y:y+5,id:2}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+45,y:y+45,id:1},{x:x+100,y:y+25,id:2}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   }else{
    await cdp.send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',buttons:1,clickCount:1,pointerType:'pen'});await cdp.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:x+40,y:y+40,button:'left',buttons:1,pointerType:'pen'});await cdp.send('Input.dispatchMouseEvent',{type:'mouseReleased',x:x+40,y:y+40,button:'left',buttons:0,clickCount:1,pointerType:'pen'});
   }
   const ink=await raw(p.page);assert.equal(ink.draft.length,1);assert(ink.draft[0].length>=2);const events=await p.page.evaluate(()=>window.hsPointers);assert(events.some(e=>e.type===pointerType&&e.trusted&&e.primary));checks.push({engine,case:pointerType+'-browser-protocol',nativeTrustedPointerEvents:true,secondaryTouchDidNotCreateExtraStroke:pointerType==='touch',physicalDeviceUsed:false});await c.close();
  }
 }finally{await browser.close();}
}}finally{writeFileSync(out+'/storage-pointer.json',JSON.stringify({base,checks,errors,physicalPhoneOrPenTested:false,humanListeningPerformed:false,audioMocked:false},null,2)+'\n');}
assert.equal(checks.length,14);assert.deepEqual(errors,[]);console.log('Passed14 native storage/recovery/two-tab/resize/manual-next/503/touch/pen cases; physical phone/pen not tested.');
