import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const base = process.env.KLINK_TEST_URL || 'https://klink-pr12-candidate.nico-554.workers.dev';
const out = process.env.KLINK_HELP_OUTPUT || 'docs/quiet-controls-speed-20261106/help-before';
const expectedSilent = process.env.KLINK_HELP_SILENT === '1';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const rows = [], errors = [];
try {
 for (const width of [1280,390]) {
  const context = await browser.newContext({ viewport:{width,height:900}, hasTouch:width===390, reducedMotion:'reduce' });
  await context.addInitScript(()=>{window.__helpWords=0;window.addEventListener('klink-word-audio-request',()=>window.__helpWords++);});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  const cdp=await context.newCDPSession(page);await cdp.send('Network.enable');await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:40,downloadThroughput:375000,uploadThroughput:125000});
  await page.goto(base+'/#learner/package/groep-1');await page.locator('.cp-tabs').getByRole('button',{name:'Oefenen met deze woorden',exact:true}).click();await page.locator('[data-activity="dictation"]').click();await page.locator('[data-exercise-id]').waitFor();
  const help=page.getByRole('button',{name:'Help',exact:true});await help.waitFor();
  const responses=[],requests=[];const tasks=[];
  page.on('request',r=>{if(/\.bin(?:\?|$)/.test(r.url()))requests.push(new URL(r.url()).pathname)});
  page.on('response',r=>{if(/\.bin(?:\?|$)/.test(r.url()))tasks.push((async()=>{const body=await r.body();responses.push({path:new URL(r.url()).pathname,status:r.status(),bytes:body.length,contentRange:r.headers()['content-range']??null})})())});
  const point=await help.evaluate(e=>{const w=document.createTreeWalker(e,NodeFilter.SHOW_TEXT);let n;while(n=w.nextNode()){if(!n.textContent.trim())continue;const r=document.createRange();r.selectNodeContents(n);const b=r.getBoundingClientRect();return{x:b.x+b.width/2,y:b.y+b.height/2}}throw Error('No Help text')});
  await page.evaluate(()=>{window.__helpWords=0;});
  const start=Date.now();if(width===390)await page.touchscreen.tap(point.x,point.y);else await page.mouse.click(point.x,point.y);
  if(expectedSilent){await page.waitForTimeout(600);assert.equal(await page.evaluate(()=>window.__helpWords),0);assert.equal(requests.length,0)}
  else {await page.waitForFunction(()=>window.__helpWords>0);await page.waitForFunction(()=>performance.getEntriesByType('resource').some(r=>r.name.endsWith('.bin')),{},{timeout:20000});await Promise.all(tasks);assert(requests.length>0);assert(responses.length>0)}
  assert.equal(await help.getAttribute('aria-expanded'),'true','Help action still opens its panel');
  rows.push({width,base,expectedSilent,wordRequests:await page.evaluate(()=>window.__helpWords),bundleRequests:requests.length,responses,settledMs:Date.now()-start,note:expectedSilent?'600 ms observation window, not a latency comparison':'Includes whole unwanted audio bundle download on 3 Mbps'});
  await context.close();writeFileSync(out+'/checks.json',JSON.stringify({rows,errors},null,2));
 }
}finally{await browser.close()}
assert.deepEqual(errors,[]);console.log('PASS',rows.length,expectedSilent?'Help is silent without an audio download':'reproduced real Help button audio download');
