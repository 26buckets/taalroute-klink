import {webkit} from 'playwright';
import {readFileSync,writeFileSync} from 'node:fs';
import sharp from 'sharp';
import assert from 'node:assert/strict';
import {chapterHash} from '../../../lib/practice-chapters.ts';
import {readProductionBank} from '../../../scripts/read-production-bank.mjs';
const out='docs/grammar-ready16-20261104/postflight';
const rows=JSON.parse(readFileSync('data/klink-production-index.json')).filter(r=>r.id.startsWith('klink10-grammar-alfa-a-'));
const browser=await webkit.launch(),results=[];
try{for(const row of rows){
 const e=readProductionBank(row).exercises[0],sequence=!!e.targetOrderIds,views=[];
 for(const [side,base]of [['local','http://127.0.0.1:19161'],['live','https://klink.taalroute.nl']]){
  const page=await browser.newPage({viewport:{width:390,height:900}});
  await page.goto(base+'/'+chapterHash({chapter:'grammar',activity:row.activity,collection:row.id,level:row.level,help:'practice'}));
  const task=page.locator(`[data-exercise-id="${e.exerciseId}"]`);await task.waitFor({timeout:60000});
  if(sequence){for(const id of e.targetOrderIds)await task.locator(`[data-order-item="${id}"]`).click();await task.locator('[data-practice-check]').click();}
  else await task.getByRole('button',{name:e.options.find(o=>e.answer.correctOptionIds.includes(o.id)).label,exact:true}).click();
  await task.locator('[data-practice-next]:not(:disabled)').waitFor();await page.reload();await task.waitFor();
  if(sequence)await task.locator('[data-practice-check]').click();
  else await task.getByRole('button',{name:e.options.find(o=>e.answer.correctOptionIds.includes(o.id)).label,exact:true}).click();
  await task.locator('[data-practice-next]:not(:disabled)').waitFor();
  // Match the settled enabled state; retain the original immediate captures separately.
  await page.waitForTimeout(1200);
  const file=`${out}/stable-${side}-${row.activity}.png`;await page.screenshot({path:file,fullPage:true});
  views.push({side,file,geometry:await task.locator('button,img').evaluateAll(nodes=>nodes.map(n=>({tag:n.tagName,text:n.textContent,rect:n.getBoundingClientRect().toJSON(),background:getComputedStyle(n).backgroundColor,opacity:getComputedStyle(n).opacity,disabled:n.disabled??null})))});
  await page.close();
 }
 const a=await sharp(views[0].file).raw().toBuffer(),b=await sharp(views[1].file).raw().toBuffer();let bytes=0,max=0;for(let i=0;i<a.length;i++){const d=Math.abs(a[i]-b[i]);if(d)bytes++;max=Math.max(max,d);}
 assert.deepEqual(views[0].geometry,views[1].geometry);results.push({activity:row.activity,geometryEqual:true,pixelIdentical:a.equals(b),differentChannelBytes:bytes,maxDelta:max,views});
}}finally{await browser.close();}
writeFileSync(out+'/stable-placement.json',JSON.stringify({scope:'Only two first-task WebKit placement comparisons, after existing CSS transitions settle; no altered tolerance, masks, CSS or reference replacement',results},null,2));console.log(results.map(({activity,geometryEqual,pixelIdentical,differentChannelBytes,maxDelta})=>({activity,geometryEqual,pixelIdentical,differentChannelBytes,maxDelta})));
