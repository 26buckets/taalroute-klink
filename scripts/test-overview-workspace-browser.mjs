import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { chapterCollections, chapterHash, practiceChapters } from '../lib/practice-chapters.ts';
const base = process.env.KLINK_TEST_URL || 'http://127.0.0.1:18843';
const out = process.env.KLINK_OVERVIEW_OUTPUT || '/tmp/klink-overview-workspace';
mkdirSync(out, { recursive: true });
let browser;
const checks = [], errors = [];
try {
 for (const [width,height] of [[1280,800],[844,390],[768,1024],[390,844],[320,480]]) {
  for (const collapsed of width>820?[false,true]:[false]) {
   browser = await chromium.launch({ channel: 'chrome', headless: true });
   for (const name of ['library','words','lessons','practice','use','use-active','meet','listen','worksheet','worksheet-heard']) {
    const page = await browser.newPage({viewport:{width,height}});
    page.on('pageerror', error=>errors.push(error.message));
    await page.addInitScript(()=>{window.Audio=class extends EventTarget{play(){return Promise.resolve()}pause(){}}});
    if(name==='library') await page.goto(base+'/#learner/packages');
    else if(['words','lessons','practice','use','use-active'].includes(name)) {
     await page.goto(base+'/#learner/package/groep-1');
     await page.locator('.cp-tabs').getByRole('button',{name:({words:'Woorden',lessons:'Stap voor stap',practice:'Oefenen met deze woorden',use:'Gebruiken','use-active':'Gebruiken'})[name],exact:true}).click();
     if(name==='use-active'){await page.getByRole('button',{name:/^Voor later/}).click();await page.locator('[data-content-id]').first().click();await page.locator('.cp-exercise-browser').waitFor();}
    } else {
     const collection=chapterCollections(name)[0];
     const chapter=practiceChapters.find(c=>c.activities.includes(name)).id;
     await page.goto(base+'/'+chapterHash({chapter,activity:name,collection:collection.id,level:collection.level}));
     await page.getByRole('button',{name:'Andere oefening',exact:true}).waitFor();
     if(['meet','listen'].includes(name)) await page.getByRole('button',{name:'Op één blad',exact:true}).click();
    }
    await page.locator('.cp-context-header').first().waitFor();
    const toggle=page.locator('.cp-nav-toggle');
    if(width>820&&((await toggle.getAttribute('aria-expanded'))==='false')!==collapsed) await toggle.click();
    await page.locator('.learner-main').evaluate(async e=>{e.scrollTo(0,0);await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);});
    const result=await page.evaluate(()=>{
     const main=document.querySelector('.learner-main');
     const header=[...document.querySelectorAll('.cp-context-header')].find(e=>e.getBoundingClientRect().height>0);
     const top=[...document.querySelectorAll('.cp-tabs,.cp-exercise-menu,.cp-page-workspace,.cp-chapter-playing > .cp-practice-display')].filter(e=>e.getBoundingClientRect().height>0&&(!e.matches('.cp-practice-display')||innerWidth<=900)).sort((a,b)=>a.getBoundingClientRect().top-b.getBoundingClientRect().top)[0];
     const content=document.querySelector('.cp-word-worksheet,.cp-practice-sheet,.cp-content,.cp-page-workspace');
     const r=top.getBoundingClientRect(),h=header.getBoundingClientRect(),c=content.getBoundingClientRect();
     return {top:r.top,headerBottom:h.bottom,left:r.left,right:r.right,contentLeft:c.left,contentRight:c.right,white:getComputedStyle(content).backgroundColor,canvas:getComputedStyle(main).backgroundColor,overflow:main.scrollWidth>main.clientWidth+1||document.documentElement.scrollWidth>innerWidth+1,outerScroll:scrollY,max:main.scrollHeight-main.clientHeight};
    });
    const label=`${name} ${width}x${height} collapsed=${collapsed}`;
    assert.equal(Math.round(result.top),width<=480?150:132,label+' fixed white top');
    assert.equal(Math.round(result.top),Math.round(result.headerBottom),label+' header joins workspace');
    assert.equal(Math.round(result.left),Math.round(result.contentLeft),label+' aligned left');
    assert.equal(Math.round(result.right),Math.round(result.contentRight),label+' aligned right');
    assert.equal(result.white,'rgb(255, 255, 255)',label+' continuous white content');
    assert.equal(result.overflow,false,label+' no horizontal overflow');
    assert.equal(result.outerScroll,0,label+' no outer scrolling');
    if(['worksheet','worksheet-heard','meet','listen'].includes(name)) {
     assert.equal(await page.locator('.cp-practice-sheet > header > h2,.cp-word-worksheet > h2').count(),0,label+' no repeated heading');
     assert.equal(await page.getByRole('button',{name:'Andere oefening',exact:true}).getAttribute('aria-expanded'),'false');
    }
    if(width===1280&&!collapsed){await page.screenshot({path:`${out}/${name}.png`});}
    await page.mouse.move(width-35,Math.min(height-100,300));await page.mouse.wheel(0,2000000);
    await page.waitForTimeout(150);
    const scroll=await page.locator('.learner-main').evaluate(e=>({top:e.scrollTop,max:e.scrollHeight-e.clientHeight}));
    assert.ok(scroll.max<=1||Math.abs(scroll.top-scroll.max)<2,label+' wheel reaches bottom');
    assert.equal(await page.evaluate(()=>scrollY),0,label+' header remains stable');
    checks.push({name,width,height,collapsed,...result,scroll});console.log(label);await page.close();
   }
   await browser.close();browser=undefined;
  }
 }
 assert.deepEqual(errors,[]); console.log(`${checks.length} overview and worksheet checks passed`);
} finally {writeFileSync(`${out}/checks.json`,JSON.stringify({base,checks,errors},null,2));await browser?.close();}
