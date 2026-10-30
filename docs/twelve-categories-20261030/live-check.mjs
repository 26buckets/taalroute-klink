import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {practiceChapters,chapterExerciseCount} from '../../lib/practice-chapters.ts';
import {alfaCChapters} from '../../lib/alfa-c-navigation.ts';
import {teacherGroups,teacherChapter} from '../../lib/alfa-c-docent.ts';
const base='https://klink.taalroute.nl';const records=[],errors=[];
for(const [engine,type] of Object.entries({chromium,webkit})){
 const browser=await type.launch();try{
 const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));
 for(const width of [1920,390]){
  await page.setViewportSize({width,height:width===390?844:900});
  for(const level of ['alfa-a','alfa-b','alfa-c','a1','a2','b1'])for(const help of ['practice','guided']){
   await page.goto(`${base}/#learner/chapters?level=${level}&help=${help}`, {waitUntil: 'domcontentloaded'});
   await page.locator('[data-chapter]').first().waitFor();
   const label=level.startsWith('alfa-')?'Alfa '+level.slice(-1).toUpperCase():level.toUpperCase();
   await page.locator(`.cp-route-level[aria-label="${label}"][aria-pressed="true"]`).waitFor();
   await page.waitForFunction(help=>document.querySelector('.cp-practice-modes [aria-pressed="true"]')?.textContent===(help==='practice'?'Zelf oefenen':'Met je docent'),help);
   assert.deepEqual(await page.locator('[data-chapter]').evaluateAll(es=>es.map(e=>e.dataset.chapter)),practiceChapters.map(c=>c.id));
   for(const c of practiceChapters){const card=page.locator(`[data-chapter="${c.id}"]`),n=chapterExerciseCount(c.id,{level,help});assert.equal(await card.isEnabled(),n>0);assert.equal(await card.locator('.cp-beta-count').innerText(),`${n} ${n===1?'oefening':'oefeningen'}`);}
   assert.equal(await page.locator('[data-alfa-c-category],[data-teacher-group]').count(),0);
   assert(await page.locator('.klink-header-beta').isVisible());
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   if(level==='alfa-c'){
    await page.waitForTimeout(250);await page.screenshot({path:`docs/twelve-categories-20261030/live-${engine}-${help}-${width}.png`});
    for(const c of alfaCChapters){await page.locator(`[data-chapter="${c.parent}"]`).click();await page.locator(`[data-alfa-c-category="${c.legacy}"]`).click();await page.locator('[data-collection]').first().waitFor();assert.equal(await page.locator('[data-collection]').count(),c.blocks.length);await page.reload({waitUntil: 'domcontentloaded'});await page.locator('[data-collection]').first().waitFor();await page.locator('.cp-context-header .text-back').click();await page.locator(`[data-alfa-c-category="${c.legacy}"]`).waitFor();await page.locator('.cp-context-header .text-back').click();await page.locator('[data-chapter]').first().waitFor();}
    if(help==='guided')for(const g of teacherGroups){await page.locator(`[data-chapter="${teacherChapter[g.id]}"]`).click();await page.locator(`[data-teacher-group="${g.id}"]`).click();await page.locator('.ac-docent').waitFor();await page.getByRole('link',{name:'Andere oefening',exact:true}).click();await page.locator(`[data-teacher-group="${g.id}"]`).waitFor();await page.locator('.cp-context-header .text-back').click();await page.locator('[data-chapter]').first().waitFor();}
   }
   records.push({engine,width,level,help,categories:12});
   console.log(engine,width,level,help);
  }
 }
 }finally{await browser.close();}
}
assert.deepEqual(errors,[]);writeFileSync('docs/twelve-categories-20261030/live-check.json',JSON.stringify({records,errors},null,2));console.log(`PASS ${records.length} live menu/count checks, Alfa C sequences, teacher return and no horizontal overflow`);
