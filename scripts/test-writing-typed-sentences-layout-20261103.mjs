import assert from 'node:assert/strict';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
import {chapterHash} from '../lib/practice-chapters.ts';
const base=process.env.KLINK_TEST_BASE||'http://127.0.0.1:19034',out=process.env.KLINK_TEST_OUTPUT||'/tmp/klink-tz-rebased-proof';
const {row,sourceIds:[id]}=JSON.parse(readFileSync('docs/writing-typed-sentences-20261103/import-manifest.json')).newRows[0];
const url=base+'/'+chapterHash({chapter:'writing',activity:row.activity,collection:row.id,level:row.level,help:row.help});
const layouts=[],storage=[],selector='[data-source-writing-text="'+id+'"]';
const ui=page=>{const task=page.locator(selector);return {task,input:task.locator('textarea'),compare:task.getByRole('button',{name:'Bewaar en vergelijk',exact:true}),finish:task.getByRole('button',{name:'Nagekeken en klaar',exact:true})};};
const record=(page,value)=>page.evaluate(({id,value})=>new Promise((resolve,reject)=>{const q=indexedDB.open('klink-writing-form-v1',1);q.onupgradeneeded=()=>q.result.createObjectStore('answers');q.onsuccess=()=>{const db=q.result,t=db.transaction('answers',value?'readwrite':'readonly'),s=t.objectStore('answers'),r=value?s.put(value,id):s.get(id);t.oncomplete=()=>{db.close();resolve(r.result);};t.onerror=()=>reject(t.error);};q.onerror=()=>reject(q.error);}),{id,value});
await Promise.all(Object.entries({chromium,webkit}).map(async([engine,type])=>{
 const browser=await type.launch({headless:true,...(engine==='chromium'?{channel:'chrome'}:{})});
 try{
 for(const [width,height] of [[1280,844],[390,844],[320,568],[568,320]])for(const theme of ['light','dark']){
  const c=await browser.newContext({viewport:{width,height}}),p=await c.newPage();await p.goto(base);await p.evaluate(theme=>window.TaalrouteAppearance.set(theme),theme);await p.goto(url);const {input,compare,finish,task}=ui(p);
  const own='  Eerste regel.\n'+('langwoord'.repeat(60));await input.fill(own);await compare.click();await finish.scrollIntoViewIfNeeded();await finish.click();await p.locator('[data-practice-next]:not(:disabled)').waitFor();
  assert.equal((await record(p)).first.text,own);assert.equal(await task.locator('.cp-source-text').nth(1).locator('p').last().textContent(),own);
  const geometry=await task.evaluate(el=>({page:document.documentElement.scrollWidth,task:el.scrollWidth,client:el.clientWidth,font:parseFloat(getComputedStyle(el.querySelector('textarea')).fontSize)}));assert(geometry.page<=width+1&&geometry.task<=geometry.client+1&&geometry.font>=16,JSON.stringify(geometry));
  layouts.push({engine,width,height,theme,ownMultilineTextPreserved:true,controlsUsable:true});await c.close();
 }
 {
  const c=await browser.newContext(),p=await c.newPage();await c.addInitScript(()=>{const put=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(...args){if(window.rejectOwnWrite&&this.name==='answers')throw new DOMException('Quota','QuotaExceededError');return put.apply(this,args);};});await p.goto(url);const {task,input,compare,finish}=ui(p);await p.evaluate(()=>{window.rejectOwnWrite=true;});await input.fill('  Eigen tekst  ');await task.getByRole('alert').waitFor();await compare.click();assert.equal(await finish.count(),0);assert.equal(await input.inputValue(),'  Eigen tekst  ');assert(await p.locator('[data-practice-next]').isDisabled());await p.evaluate(()=>{window.rejectOwnWrite=false;});await compare.click();await finish.waitFor();assert.equal((await record(p)).first.text,'  Eigen tekst  ');storage.push({engine,case:'quota'});await c.close();
 }
 {
  const c=await browser.newContext(),p=await c.newPage();await p.goto(base);const unknown={version:99,draft:{text:'Niet wijzigen'}};await record(p,unknown);await p.goto(url);const {task,input}=ui(p);await task.getByRole('alert').waitFor();assert(await input.isDisabled());assert.deepEqual(await record(p),unknown);storage.push({engine,case:'unknown-version'});await c.close();
 }
 {
  const c=await browser.newContext(),p=await c.newPage(),q=await c.newPage();await p.goto(url);await q.goto(url);const a=ui(p),b=ui(q);await q.waitForFunction(sel=>!document.querySelector(sel+' textarea')?.disabled&&!!document.querySelector(sel+' textarea'),selector);
  await a.input.fill('  Eerste  ');await a.compare.click();await a.finish.waitFor();await b.input.fill('  Tweede  ');await b.compare.click();await b.finish.waitFor();assert.deepEqual(await record(q),{version:1,draft:{text:'  Tweede  '},first:{text:'  Eerste  '},last:{text:'  Tweede  '}});storage.push({engine,case:'two-tabs'});await c.close();
 }
 }finally{await browser.close();}
}));
assert.equal(layouts.length,16);assert.equal(storage.length,6);mkdirSync(out,{recursive:true});writeFileSync(out+'/layout-storage.json',JSON.stringify({base,layouts,storage,physicalDevicesTested:false},null,2)+'\n');
console.log('16 layouts and 6 storage checks passed.');
