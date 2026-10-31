import assert from 'node:assert/strict';
import { mkdirSync,readFileSync,writeFileSync } from 'node:fs';
import { chromium,webkit } from 'playwright';
const base=process.env.KLINK_TEST_URL||'http://127.0.0.1:18976',out=process.env.KLINK_SIZE_OUTPUT||'docs/image-size-audit-20261031/browser';mkdirSync(out,{recursive:true});
const mapping=JSON.parse(readFileSync('data/klink-compact-images-20261031.json'));
const checks=[],errors=[];
for(const [engine,type]of Object.entries({chromium,webkit})){
 const browser=await type.launch();
 try{for(const width of [1366,390]){
  const context=await browser.newContext({viewport:{width,height:950},deviceScaleFactor:2}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base,{waitUntil:'networkidle'});await page.locator('.entry-visual img').evaluate(i=>i.decode());
  const resources=await page.evaluate(()=>performance.getEntriesByType('resource').map(r=>({url:r.name,bytes:r.encodedBodySize,transfer:r.transferSize,ms:r.duration})));
  assert(!resources.some(r=>/klink-curriculum|klink-production-index|teacher-classroom\.tsx|learner-app\.tsx/.test(r.url)),'Landing eagerly loads lesson content');
  assert(!resources.some(r=>r.url.includes('/_next/image?')),'Images unnecessarily use runtime optimizer');
  await page.screenshot({path:out+'/'+engine+'-'+width+'-entry.png'});
  checks.push({engine,width,screen:'entry',resources});
  await page.goto(base+'/#learner/words');await page.locator('.cp-global-word-grid img').first().waitFor();
  await page.locator('.cp-global-word-grid img').first().evaluate(i=>i.decode());
  const images=await page.locator('img').evaluateAll(imgs=>imgs.filter(i=>i.complete&&i.naturalWidth).map(i=>({src:new URL(i.currentSrc).pathname,width:i.clientWidth,naturalWidth:i.naturalWidth})));
  assert(images.some(i=>i.src.startsWith('/compact-images-20261031/')));assert(images.every(i=>!mapping[i.src]),'Original heavy image rendered');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  checks.push({engine,width,screen:'words',images});await page.screenshot({path:out+'/'+engine+'-'+width+'-words.png'});
  await context.close();
 }
 // All image derivatives decode in small groups, without loading image bytes into the conversation.
 const page=await browser.newPage();await page.goto(base);const urls=[...new Set(Object.values(mapping))];
 for(let i=0;i<urls.length;i+=20){const results=await page.evaluate(async urls=>Promise.all(urls.map(src=>new Promise(resolve=>{const img=new Image();img.onload=()=>resolve({src,ok:img.naturalWidth>0});img.onerror=()=>resolve({src,ok:false});img.src=src;}))),urls.slice(i,i+20));assert(results.every(r=>r.ok),JSON.stringify(results.filter(r=>!r.ok)));}
 checks.push({engine,decoded:urls.length});
 }finally{await browser.close();}
}
assert.deepEqual(errors,[]);writeFileSync(out+'/checks.json',JSON.stringify({checks,errors},null,2));console.log('PASS image loading, lazy entry, all compact derivatives, desktop/mobile in two browsers');
