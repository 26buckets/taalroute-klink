import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium} from 'playwright';
import {availableChapterActivities,practiceChapters} from '../lib/practice-chapters.ts';
const base=process.env.KLINK_TEST_URL||'http://127.0.0.1:18848';
const out=process.env.KLINK_AVAILABILITY_OUTPUT||'outputs/practice-availability';
mkdirSync(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const results=[],errors=[];
try{
 for(const [width,height,collapsed] of [[1366,900,false],[1366,900,true],[390,844,false],[320,568,false]]){
  const page=await browser.newPage({viewport:{width,height}});
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`${base}/#learner/chapters/words/meet?level=alfa-c&help=practice`);
  await page.locator('.cp-unavailable').waitFor();
  if(collapsed)await page.getByRole('button',{name:'Menu inklappen',exact:true}).click();
  assert(await page.getByRole('button',{name:'Alfa C',exact:true}).isDisabled());
  assert.equal(await page.getByRole('button',{name:'Alfa C',exact:true}).getAttribute('aria-pressed'),'true');
  assert(!(await page.getByText(/Kies samen met je docent ander aanbod/).count()));
  await page.getByRole('button',{name:'Oefen met je docent',exact:true}).click();
  await page.locator('[data-collection]').first().waitFor();
  assert(page.url().includes('level=alfa-c')&&page.url().includes('help=guided'));
  assert.equal(await page.locator('[data-chapter-activity]').count(),0,'one activity skips unnecessary page');
  await page.locator('[data-collection]').first().click();
  await page.locator('[data-exercise-id],.cp-guided-start').first().waitFor();
  assert(page.url().includes('level=alfa-c'));
  await page.goto(`${base}/#learner/chapters/words?level=alfa-a&help=practice`);
  await page.locator('[data-chapter-activity="meet"]').waitFor();
  const cards=page.locator('[data-chapter-activity]');
  assert.equal(await cards.count(),practiceChapters.find(c=>c.id==='words').activities.length);
  for(const card of await cards.all()){
   const id=await card.getAttribute('data-chapter-activity');
   const available=availableChapterActivities('words',{level:'alfa-a',help:'practice'}).includes(id);
   assert.equal(await card.isEnabled(),available,id);
   if(!available)assert((await card.innerText()).includes('Niet beschikbaar'));
  }
  await page.screenshot({path:`${out}/choices-${width}-${collapsed}.png`});
  await cards.last().scrollIntoViewIfNeeded();
  assert(await cards.last().isVisible());
  assert(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)));
  await page.locator('[data-chapter-activity="meet"]').click();
  await page.locator('[data-collection]').first().waitFor();
  assert(await page.getByRole('button',{name:'Alfa C',exact:true}).isDisabled());
  await page.locator('[data-picture-settings] summary').click();
  assert(await page.getByRole('button',{name:'Overige inhoud',exact:true}).isDisabled());
  await page.keyboard.press('Escape');
  await page.locator('[data-collection]').first().click();
  await page.locator('[data-exercise-id]').waitFor();
  const id=await page.locator('[data-exercise-id]').getAttribute('data-exercise-id');
  const readStorage=()=>page.evaluate(()=>Object.fromEntries(Object.entries(localStorage).map(([k,v])=>{try{return[k,JSON.parse(v)];}catch{return[k,v];}})));
  const stored=await readStorage();
  await page.reload();await page.locator('[data-exercise-id]').waitFor();
  assert.equal(await page.locator('[data-exercise-id]').getAttribute('data-exercise-id'),id);
  assert.deepEqual(await readStorage(),stored);
  results.push({width,height,collapsed,disabledChoices:true,staleLinkRecovered:true,levelPreserved:true,scroll:true,reloadPreservesProgress:true});
  await page.close();
 }
 const page=await browser.newPage();
 for(const level of ['alfa-a','alfa-b','alfa-c','a1','a2','b1','support'])for(const help of ['practice','guided']){
  await page.goto(`${base}/#learner/chapters?level=${level}&help=${help}`);
  await page.locator('[data-chapter]').first().waitFor();
  for(const chapter of practiceChapters)assert.equal(await page.locator(`[data-chapter="${chapter.id}"]`).isEnabled(),availableChapterActivities(chapter.id,{level,help}).length>0,`${level}/${help}/${chapter.id}`);
 }
 await page.close();
 assert.deepEqual(errors,[]);
 writeFileSync(`${out}/checks.json`,JSON.stringify({results,rootCombinations:168,errors},null,2));
 console.log('PASS four layouts, 168 root choices, grey controls, stale Alfa C link, single-activity shortcut, scrolling, reload and saved progress');
}finally{await browser.close();}
