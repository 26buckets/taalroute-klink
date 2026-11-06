import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
import sharp from 'sharp';
const remote=process.env.KLINK_OPENING_REMOTE === '1';
const out=process.env.KLINK_PERF_APPEARANCE_OUTPUT || 'docs/performance-20261102/appearance';mkdirSync(out,{recursive:true});const rows=[];
for(const [engine,type] of Object.entries({chromium,webkit})){
 const b=await type.launch();try{for(const width of [1280,390])for(const colorScheme of ['light','dark'])for(const [name,hash,selector] of [['entry','','.landing-start'],['learner','#learner','.learner-app'],['docent','#teacher/plus','.kpd-lesson-choice'],['collections','#learner/chapters/words/meet?help=practice','.cp-chapter-collections'],...(remote?[['exercise','#learner','[data-exercise-id]']]:[])]){
  const images=[];
  for(const [version,port] of [['before',19124],['after',19120]]){
   const c=await b.newContext({viewport:{width,height:900},colorScheme,reducedMotion:'reduce'}),p=await c.newPage();const base=version==='after'?'https://klink.taalroute.nl':`http://127.0.0.1:${port}`;await p.goto(`${base}/${hash}`,{waitUntil:'domcontentloaded'});
   if(name==='exercise'){await p.locator('[data-chapter="words"]').click();await p.locator('[data-chapter-activity="meet"]').click();await p.locator('[data-collection]').first().click();}
   await p.locator(selector).first().waitFor();await p.locator('.klink-opening-loader').waitFor({state:'detached'});
   await p.evaluate(()=>document.fonts.ready);await p.waitForFunction(()=>[...document.images].filter(i=>{const r=i.getBoundingClientRect();return r.width&&r.height&&r.top<innerHeight&&r.bottom>0}).every(i=>i.complete));
   await p.waitForTimeout(100);const path=`${out}/${engine}-${width}-${colorScheme}-${name}-${version}.png`;await p.screenshot({path,animations:'disabled'});images.push(await sharp(path).ensureAlpha().raw().toBuffer());await c.close();
  }
  assert.equal(images[0].length,images[1].length);let changedPixels=0;
  for(let i=0;i<images[0].length;i+=4)if(images[0][i]!==images[1][i]||images[0][i+1]!==images[1][i+1]||images[0][i+2]!==images[1][i+2])changedPixels++;
  rows.push({engine,width,colorScheme,name,changedPixels});writeFileSync(out+'/comparison.json',JSON.stringify(rows,null,2));
 }}finally{await b.close();}
}
assert(rows.every(r=>r.changedPixels===0),'Inspect every non-identical screenshot; do not reset the appearance reference');console.log('PASS',rows.length,'pixel-identical desktop/mobile light/dark screen pairs');
