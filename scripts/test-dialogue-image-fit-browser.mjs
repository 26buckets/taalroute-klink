import assert from 'node:assert/strict';
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
const {chromium}=await import('/Users/nicoknoester/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const base=process.env.KLINK_TEST_URL||'http://localhost:18927';
const out=process.env.KLINK_DIALOGUE_OUTPUT||'outputs/dialogue-image-fit';mkdirSync(out,{recursive:true});
const data=JSON.parse(readFileSync('data/klink-dialogue-repair.json'));
const b=await chromium.launch({headless:true}); const p=await b.newPage(); const errors=[],checks=[];
p.on('pageerror',e=>errors.push(e.message));
async function inspect(d,width,height=900) {
 await p.setViewportSize({width,height});
 await p.goto(`${base}/#learner/chapters/practical/dialogues/${d.id}?level=${d.sourceLevel.toLowerCase()}`);
 await p.waitForFunction(id=>document.querySelector('.cp-exercise-browser')?.dataset.exerciseId.includes(id),d.id);
 const img=p.locator('.cp-dialogue-scene > img');await img.waitFor();
 await p.waitForFunction(src=>{const e=document.querySelector('.cp-dialogue-scene > img');return e?.complete&&e.naturalWidth>0&&e.getAttribute('src')===src;},d.image.src);
 const metrics=await img.evaluate(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return {natural:[e.naturalWidth,e.naturalHeight],box:[r.width,r.height],fit:s.objectFit,border:s.borderWidth};});
 assert.equal(metrics.fit,'contain');assert.equal(metrics.border,'0px');
 assert(Math.abs(metrics.box[1]-metrics.box[0]*metrics.natural[1]/metrics.natural[0])<1,`${d.id}/${width}: complete natural image ratio`);
 assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 await img.scrollIntoViewIfNeeded();
 assert(await img.evaluate(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0;}));
 await p.getByRole('button',{name:'Volgende spreekbeurt',exact:true}).click();
 assert.equal(await p.locator('.cp-dialogue-current h3').innerText(),d.turns[1].speaker);
 await p.getByRole('button',{name:'Vorige spreekbeurt',exact:true}).click();
 assert.equal(await p.locator('.cp-dialogue-current h3').innerText(),d.turns[0].speaker);
 checks.push({id:d.id,width,height,...metrics});
}
try {
 const pilot=data.dialogues.find(d=>d.id==='klink-dialogue-32f962399de8f4c3');
 for (const width of [320,390,630,760,761,1366,1920]) {
  await inspect(pilot,width);
  if([390,630,1366].includes(width)){await p.locator('.cp-dialogue-scene > img').scrollIntoViewIfNeeded();await p.screenshot({path:`${out}/${width}.png`});await p.locator('.cp-dialogue-scene > img').screenshot({path:`${out}/photo-${width}.png`});}
 }
 for (const width of [320,630]) await inspect(pilot,width,480);
 for(const d of data.dialogues) for(const width of [390,630,1366]) await inspect(d,width);
 assert.deepEqual(errors,[]);
 writeFileSync(`${out}/image-fit.json`,JSON.stringify({passed:true,dialogues:128,checks:checks.length,results:checks,errors},null,2)+'\n');
 console.log(`PASS ${checks.length} photo/controls checks: all 128 dialogues at mobile/tablet/desktop, 7 pilot widths and short screens`);
} finally {await b.close();}
