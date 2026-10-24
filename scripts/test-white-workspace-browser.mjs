import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { chapterCollections, chapterHash } from '../lib/practice-chapters.ts';
const base = process.env.KLINK_TEST_URL || 'http://127.0.0.1:18843';
const out = process.env.KLINK_WORKSPACE_OUTPUT || '/tmp/klink-white-workspace';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage(); const checks = [], errors = [];
page.on('pageerror', error => errors.push(error.message));
await page.addInitScript(() => { window.Audio = class extends EventTarget { play() { this.timer=setTimeout(()=>this.dispatchEvent(new Event('ended')),30);return Promise.resolve(); } pause(){clearTimeout(this.timer);} }; });
async function open(name) {
 if (['chapters','words','review'].includes(name)) { await page.goto(base+'/#learner/'+name);await page.locator('.cp-page-workspace').waitFor();return; }
 if (name==='lesson'||name==='mix') {
  await page.goto(base+'/#learner/package/groep-1');
  await page.locator('.cp-tabs').getByRole('button',{name:name==='lesson'?'Stap voor stap':'Oefenen met deze woorden',exact:true}).click();
  if(name==='lesson')await page.locator('.cp-start-lesson').first().click();else await page.getByRole('button',{name:'Woordenmix',exact:true}).click();
 } else {
  const activity=name==='pen'?'meet':name==='listen'?'listen':'sound-compare';
  const collection=chapterCollections(activity).find(c=>c.title==='pen · kip');
  await page.goto(base+'/'+chapterHash({chapter:activity==='sound-compare'?'sounds':'words',activity,collection:collection.id,level:collection.level}));
 }
 await page.getByRole('button',{name:'Andere oefening',exact:true}).waitFor();
 const pause=page.getByRole('button',{name:'Automatisch verder pauzeren',exact:true});if(await pause.count())await pause.click();
}
try {
 for(const [width,height] of [[1280,800],[768,1024],[390,844],[320,480],[844,390]]) {
  await page.setViewportSize({width,height});
  for(const collapsed of width>820?[false,true]:[false]) {
   let expected;
   for(const name of ['lesson','pen','listen','sound','mix','chapters','words','review']) {
    await open(name);
    const toggle=page.locator('.cp-nav-toggle');if(width>820 && ((await toggle.getAttribute('aria-expanded'))==='false')!==collapsed)await toggle.click();
    await page.waitForFunction(()=>[...document.querySelectorAll('.learner-main img')].filter(e=>{const r=e.getBoundingClientRect();return r.top<innerHeight&&r.bottom>0}).every(e=>e.complete&&e.naturalWidth>0));
    await page.locator('.learner-main').evaluate(async e=>{ e.scrollTo(0,0); await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame); e.scrollTo(0,0); });
    const geometry=await page.evaluate(()=>{
      const header=document.querySelector('.cp-context-header:not(.cp-player-bar)')||document.querySelector('.cp-context-header');
      const workspace=document.querySelector('.cp-page-workspace')||document.querySelector('.cp-exercise-browser');
      const display=document.querySelector('.cp-chapter-playing > .cp-practice-display');
      const rect=workspace.getBoundingClientRect();const h=header.getBoundingClientRect();
      const surfaceTop=display && innerWidth<=900 ? display.getBoundingClientRect().top : rect.top;
      return {left:rect.left,right:rect.right,top:surfaceTop,headerBottom:h.bottom,windowScroll:scrollY,overflow:document.documentElement.scrollWidth>innerWidth+1};
    });
    const edges=[geometry.left,geometry.right,geometry.top].map(Math.round);
    if(!expected)expected=edges;
    assert.deepEqual(edges,expected,`${name}, ${width}x${height}, collapsed=${collapsed}: white edges match`);
    assert.equal(Math.round(geometry.top),Math.round(geometry.headerBottom),`${name}: no gap before white workspace`);
    assert.equal(geometry.overflow,false);
    assert.equal(geometry.windowScroll,0,'Only the content may scroll; the app header must stay in place');
    if(width===1280&&!collapsed){await page.waitForFunction(()=>[...document.querySelectorAll('.learner-main img')].filter(e=>{const r=e.getBoundingClientRect();return r.top<innerHeight&&r.bottom>0}).every(e=>e.complete&&e.naturalWidth>0));await page.screenshot({path:`${out}/${name}.png`});}
    checks.push({name,width,height,collapsed,edges});
   }
  }
 }
 assert.deepEqual(errors,[]);console.log(`${checks.length} white-workspace comparisons passed`);
} catch(error) { console.log(await page.evaluate(()=>[...document.querySelectorAll('.learner-main,.cp-chapter-playing,.cp-context-header,.cp-practice-display')].map(e=>({className:e.className,top:e.getBoundingClientRect().top,height:e.getBoundingClientRect().height,scroll:e.scrollTop,rows:getComputedStyle(e).gridTemplateRows})))); throw error; } finally {writeFileSync(`${out}/checks.json`,JSON.stringify({base,checks,errors},null,2));await browser.close();}
