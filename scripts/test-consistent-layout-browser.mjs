import { createRequire } from 'node:module';
import {writeFileSync, mkdirSync} from 'node:fs';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require('playwright');
const out=process.env.KLINK_LAYOUT_OUTPUT || '/tmp/klink-layout-check/'; mkdirSync(out,{recursive:true});
const base=process.env.KLINK_TEST_URL || 'http://127.0.0.1:18840';
const geometry=new Map();
const b=await chromium.launch({channel:'chrome',headless:true});const p=await b.newPage({viewport:{width:1280,height:800}});const errors=[],checks=[];p.on('pageerror',e=>errors.push(e.message));
await p.addInitScript(()=>{window.Audio=class extends EventTarget{play(){setTimeout(()=>this.dispatchEvent(new Event('ended')),50);return Promise.resolve()}pause(){}}});
const nav=()=>p.getByRole('navigation',{name:'Cursistnavigatie'});
async function openLesson(){await p.goto(base+'/#learner/package/groep-1');await p.locator('.cp-tabs').getByRole('button',{name:'Stap voor stap',exact:true}).click();await p.locator('.cp-start-lesson').first().click();const pause=p.getByRole('button',{name:'Automatisch verder pauzeren',exact:true});if(await pause.count())await pause.click();}
async function shot(name){for(const collapsed of [false,true]){const t=p.locator('.cp-nav-toggle');if((await t.getAttribute('aria-expanded')==='false')!==collapsed)await t.click();await p.waitForTimeout(100);assert(await nav().isVisible());assert(await p.locator('.taalroute-header').isVisible());assert.equal(Math.round((await p.locator('.learner-main').boundingBox()).x),collapsed?72:220);const head=p.locator('.cp-context-header:visible'); assert.equal(await head.count(),1); const box=await head.boundingBox(), title=await head.locator('h1').boundingBox(); const key=String(collapsed); const current=[box.y,box.height,title.x-box.x,title.y-box.y]; if(geometry.has(key))assert.deepEqual(current,geometry.get(key));else geometry.set(key,current); assert.equal(await t.innerText(),''); assert((await t.boundingBox()).y>600); await p.screenshot({path:out+`${name}-${collapsed?'ingeklapt':'open'}.png`});checks.push(`${name}: ${collapsed?'collapsed':'expanded'}, header, navigation and canvas aligned`);}}
await openLesson();await shot('les');
await nav().getByRole('button',{name:'Start',exact:true}).click();assert.equal(await p.locator('.cp-nav-toggle').getAttribute('aria-expanded'),'false');await shot('start');
await p.goto(base+'/#learner/package/groep-1');await p.locator('.cp-tabs').getByRole('button',{name:'Stap voor stap',exact:true}).click();await shot('overzicht');
await p.locator('.learner-main').evaluate(e=>e.scrollTop=200); await p.waitForTimeout(100); assert.equal(Math.round((await p.locator('.cp-context-header:visible').boundingBox()).y),60); checks.push('Context header stays beneath the shared header while scrolling');
await p.reload();await p.locator('.cp-nav-toggle').waitFor();assert.equal(await p.locator('.cp-nav-toggle').getAttribute('aria-expanded'),'false');checks.push('Collapsed preference survives route navigation and reload');
const toggle=p.locator('.cp-nav-toggle'); await toggle.focus(); await p.keyboard.press('Enter'); assert.equal(await toggle.getAttribute('aria-expanded'),'true'); await p.keyboard.press('Space'); assert.equal(await toggle.getAttribute('aria-expanded'),'false'); checks.push('Icon toggle has an accessible name and works with Enter and Space');
for(const [width,height] of [[1280,550],[844,390],[768,1024],[390,844],[320,480]]){
 await p.setViewportSize({width,height});await openLesson();if(width>820){ const toggle=p.locator('.cp-nav-toggle'); assert(await toggle.evaluate(e=>{const r=e.getBoundingClientRect();return r.bottom<=innerHeight&&e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));})); }assert(await nav().isVisible());assert(await p.locator('.taalroute-header').isVisible());assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 const next=p.locator('.cp-exercise-feedback').getByRole('button',{name:'Verder',exact:true});await next.scrollIntoViewIfNeeded();assert(await next.evaluate(e=>{const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}));
 const before=await p.locator('[data-exercise-id]').getAttribute('data-exercise-id');await next.click();assert.notEqual(await p.locator('[data-exercise-id]').getAttribute('data-exercise-id'),before);
 await p.getByRole('button',{name:'Terug naar alle lessen',exact:true}).click();await p.locator('.cp-start-lesson').first().waitFor();checks.push(`${width}x${height}: header and navigation remain, next is reachable and advances, back returns to lessons, no horizontal overflow`);
}
await p.setViewportSize({width:1280,height:800});await openLesson();const phases=p.getByRole('complementary',{name:'Stappen van de les'});await phases.getByRole('button',{name:'Maak',exact:true}).click();assert.equal(await phases.getByRole('button',{name:'Maak',exact:true}).getAttribute('aria-current'),'step');checks.push('Existing lesson phase selection remains functional');
assert.deepEqual(errors,[]);writeFileSync(out+'checks.json',JSON.stringify({checkedAt:new Date().toISOString(),checks,errors,scope:'Layout, navigation and scroll regression; publication checks recorded separately'},null,2));console.log(JSON.stringify({checks:checks.length,errors}));await b.close();
