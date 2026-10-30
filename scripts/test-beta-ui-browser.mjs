import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium, webkit } from 'playwright';
import { chapterCollections, chapterHash, availableChapterCollections } from '../lib/practice-chapters.ts';
const base = process.env.KLINK_TEST_URL || 'http://127.0.0.1:18856';
const out = 'docs/ui-20261030'; mkdirSync(out, {recursive:true});
const checks=[];
for (const [engine,type] of Object.entries({chromium,webkit})) {
 const browser=await type.launch();
 try {
  const page=await browser.newPage(); const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.Audio=class extends EventTarget{constructor(src){super();this.src=src;this.paused=true;}play(){this.paused=false;this.timer=setTimeout(()=>{this.paused=true;this.dispatchEvent(new Event('ended'));},30);return Promise.resolve();}load(){}removeAttribute(){}pause(){clearTimeout(this.timer);this.paused=true;}};});
  for(const size of [{width:1366,height:768},{width:1024,height:600},{width:1280,height:720},{width:768,height:1024},{width:390,height:844}]){
   await page.setViewportSize(size);const heights=[];
   for(const activity of ['listen','read','hear-match','match','cards','meet']){
    const row=chapterCollections(activity).find(r=>r.id==='groep-1.alfa-a');assert(row,activity);
    await page.goto(base+'/'+chapterHash({chapter:'words',activity,level:'all',help:'practice',collection:row.id}));
    await page.locator('.cp-task-card').waitFor();await page.waitForTimeout(120);
    const metrics=await page.evaluate(()=>{const stage=document.querySelector('.cp-exercise-stage'),feedback=document.querySelector('.cp-exercise-feedback'),nav=document.querySelector('.learner-nav'),r=stage.getBoundingClientRect(),f=feedback.getBoundingClientRect();const button=stage.querySelector('.cp-corner-prompt > button,.cp-corner-listen'); const br=button?.getBoundingClientRect();return {height:r.height,overflow:stage.scrollHeight-stage.clientHeight,bottom:f.bottom,limit:getComputedStyle(nav).position==='fixed'?nav.getBoundingClientRect().top:innerHeight,horizontal:document.documentElement.scrollWidth-innerWidth,corner:!br||Math.abs(br.x-r.x-12)<2&&Math.abs(br.y-r.y-12)<2};});
    assert(metrics.horizontal<=1,JSON.stringify({engine,size,activity,metrics}));
    assert(metrics.overflow<=2,JSON.stringify({engine,size,activity,metrics}));
    assert(metrics.bottom<=metrics.limit+1,JSON.stringify({engine,size,activity,metrics}));assert(metrics.corner,JSON.stringify({engine,size,activity,metrics}));
    assert(await page.locator('.klink-header-beta').isVisible());heights.push(metrics.height);
    if(activity==='listen')await page.screenshot({path:`${out}/${engine}-${size.width}x${size.height}.png`});
   }
   assert(Math.max(...heights)-Math.min(...heights)<=2,JSON.stringify({engine,size,heights}));
   checks.push({engine,...size,activities:6,stableHeight:true,noScroll:true,listenTopLeft:true,beta:true});
  }
  for(const level of ['alfa-c','a1','a2','b1']) {
   const selection={chapter:'words',level,help:'practice'};
   await page.goto(base+'/'+chapterHash(selection));await page.locator('[data-chapter-activity="listen"] .cp-beta-count').waitFor();
   for(const activity of ['listen','hear-match']){
    const rows=availableChapterCollections(activity,selection,{}),total=rows.reduce((n,r)=>n+(r.exerciseCount??r.exercises.length),0);
    assert.equal(await page.locator(`[data-chapter-activity="${activity}"] .cp-beta-count`).innerText(),`${total} oefeningen`);
   }
   await page.locator('[data-chapter-activity="listen"]').click();await page.locator('.cp-chapter-collection .cp-beta-count').first().waitFor();
   checks.push({engine,level,filteredCounts:true});
  }
  await page.goto(base+'/#learner/chapters?level=alfa-c&help=practice');await page.locator('[data-chapter="words"] .cp-beta-count').waitFor();
  await page.locator('.hdr001-menu-trigger').click();assert(await page.getByRole('link',{name:'Docentenhandleiding',exact:true}).isVisible());
  await page.getByRole('link',{name:'Klink Plus docent',exact:true}).click();await page.getByRole('button',{name:'Les openen',exact:true}).waitFor().catch(async e=>{console.log('Menu failure',page.url(),(await page.locator('body').innerText()).slice(0,1000));await page.screenshot({path:`${out}/menu-failure.png`});throw e;});assert(await page.locator('.klink-header-beta').isVisible());
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
}
writeFileSync(`${out}/beta-ui-checks.json`,JSON.stringify(checks,null,2));console.log(`Passed ${checks.length} layout/count checks in Chromium and WebKit`);
