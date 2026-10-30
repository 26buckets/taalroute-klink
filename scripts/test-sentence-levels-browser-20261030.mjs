import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import{chromium,webkit}from'playwright';
import{availableChapterCollections}from'../lib/practice-chapters.ts';
const base=process.env.KLINK_TEST_URL||'http://127.0.0.1:18946';
const checks=[],errors=[];
const out=process.env.KLINK_REVIEW_OUTPUT||'docs/sentence-levels-20261030';
for(const [engine,browserType] of Object.entries({chromium,webkit})){
 const browser=await browserType.launch({headless:true});
 try{
  for(const viewport of [{width:1366,height:768},{width:390,height:844}]){
   const page=await browser.newPage({viewport});page.setDefaultTimeout(20000);page.on('pageerror',e=>errors.push(e.message));
   for(const level of ['a1','a2'])for(const activity of ['sentences','find-sentence','sentence-build','sentence-dictation','sentence-speak','word-sentence']){
    const rows=availableChapterCollections(activity,{level,help:'guided'});if(!rows.length)continue;
    await page.goto(`${base}/#learner/chapters/sentences/${activity}?level=${level}&help=guided`);
    const card=page.locator(`[data-collection="${rows[0].id}"]`);await card.waitFor();
    assert.match(await card.innerText(),new RegExp(`${rows[0].exercises.length} oefening`));
    await card.click();await page.locator('[data-exercise-id]').first().waitFor();
    const id=await page.locator('[data-exercise-id]').first().getAttribute('data-exercise-id');assert(rows[0].exercises.some(e=>e.exerciseId===id),id);
    assert(page.url().includes('level='+level));
    await page.reload();await page.locator('[data-exercise-id]').first().waitFor();
    checks.push({engine,width:viewport.width,level,activity,count:rows[0].exercises.length});
   }
   await page.goto(`${base}/#learner/chapters/sentences/sentences/groep-1.support?level=support`);await page.locator('[data-collection]').first().waitFor();
   checks.push({engine,width:viewport.width,legacySupportRoute:true});
   await page.screenshot({path:`${out}/${engine}-${viewport.width}.png`,fullPage:true});await page.close();
  }
 }finally{await browser.close();}
}
assert.deepEqual(errors,[]);writeFileSync(out+'/level-browser.json',JSON.stringify({checks,errors},null,2));console.log(`${checks.length} browser checks passed`);
