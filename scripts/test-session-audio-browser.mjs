import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
const {chromium}=await import('/Users/nicoknoester/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const dialogues=JSON.parse(readFileSync('data/klink-dialogue-repair.json')).dialogues;
const base=process.env.KLINK_TEST_URL||'http://localhost:18930';
const out=process.env.KLINK_SESSION_OUTPUT||'outputs/session-audio';mkdirSync(out,{recursive:true});
const browser=await chromium.launch();const page=await browser.newPage();const errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{
 window.__plays=[];window.__duration=40;window.Audio=class extends EventTarget{
  constructor(src){super();this.src=src;window.__audio=this;this.currentTime=0;}
  play(){window.__plays.push({src:this.src,rate:this.playbackRate,pitch:this.preservesPitch});this.paused=false;this.timer=setTimeout(()=>{this.paused=true;this.dispatchEvent(new Event('ended'));},window.__duration);return Promise.resolve();}
  pause(){this.paused=true;clearTimeout(this.timer);}
 };
});
const button=name=>page.getByRole('button',{name,exact:true});
const slow=()=>button('Langzamer afspelen');
async function open(d){await page.goto(`${base}/#learner/chapters/practical/dialogues/${d.id}?level=${d.sourceLevel.toLowerCase()}`);await page.waitForFunction(id=>document.querySelector('.cp-exercise-browser')?.dataset.exerciseId.includes(id),d.id);await slow().waitFor();}
async function lastRate(expected){assert.equal(await page.evaluate(()=>window.__audio.playbackRate),expected);assert.equal(await page.evaluate(()=>window.__audio.preservesPitch),true);}
try{
 const pilot=dialogues.find(d=>d.id==='klink-dialogue-d0a263adf67c1b3c');await open(pilot);assert.equal(await slow().getAttribute('aria-pressed'),'false');
 await page.evaluate(()=>window.__duration=10000);await button('Luister naar het gesprek').click();await lastRate(.85);
 await page.evaluate(()=>window.__audio.currentTime=2);await slow().focus();await page.keyboard.press('Enter');await lastRate(.65);
 assert.deepEqual(await page.evaluate(()=>({starts:window.__plays.length,time:window.__audio.currentTime,paused:window.__audio.paused})),{starts:1,time:2,paused:false});
 await button('Pauze').click();await slow().click();await lastRate(.85);await slow().click();
 for(const width of [320,390,630,1366]){await page.setViewportSize({width,height:900});await slow().scrollIntoViewIfNeeded();assert(await slow().isVisible());const box=await slow().boundingBox();assert(box.height>=48);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:`${out}/snail-${width}.png`});}
 await page.evaluate(()=>window.__duration=40);
 for(const d of dialogues){await open(d);assert.equal(await slow().getAttribute('aria-pressed'),'true');await page.evaluate(()=>window.__plays=[]);await button('Luister naar het gesprek').click();await page.waitForFunction(()=>document.querySelector('.cp-dialogue-position')?.textContent==='4 / 4'&&window.__audio.paused);const played=await page.evaluate(()=>window.__plays);assert.deepEqual(played.map(p=>p.src),d.turns.map(t=>t.src));assert(played.every(p=>p.rate===.65&&p.pitch));}
 await page.reload();await slow().waitFor();assert.equal(await slow().getAttribute('aria-pressed'),'true');
 await button('Oefen per beurt').click();await button('Luister naar deze beurt').click();await lastRate(.65);
 await page.locator('.cp-dialogue-transcript summary').click();await page.locator('.cp-dialogue-transcript > button').nth(1).click();await lastRate(.65);
 await page.goto(`${base}/#learner/words`);await page.locator('.cp-word-listen').first().click();await lastRate(.65);
 await page.goto(`${base}/#learner/sounds`);await page.locator('.cp-sound-play').first().click();await lastRate(.65);
 await open(pilot);assert.equal(await slow().getAttribute('aria-pressed'),'true');await slow().click();await page.evaluate(()=>window.__duration=10000);await button('Luister naar het gesprek').click();await lastRate(.85);await button('Pauze').click();
 await page.goto(`${base}/#learner/sounds`);await page.locator('.cp-sound-play').first().click();await lastRate(1);
 await open(pilot);await slow().click();await page.locator('.learner-profile').click();await page.waitForFunction(()=>!document.querySelector('.learner-app'));await open(pilot);assert.equal(await slow().getAttribute('aria-pressed'),'false');assert.equal(await page.evaluate(()=>sessionStorage.getItem('klink.slow-audio.v1')),null);
 // Storage denial must not stop in-memory tempo selection or navigation.
 await page.addInitScript(()=>Object.defineProperty(window,'sessionStorage',{get(){throw Error('storage denied');}}));await page.reload();await slow().waitFor();await slow().click();await page.goto(`${base}/#learner/words`);await page.locator('.cp-word-listen').first().click();await lastRate(.65);await open(pilot);assert.equal(await slow().getAttribute('aria-pressed'),'true');
 assert.deepEqual(errors,[]);writeFileSync(`${out}/results.json`,JSON.stringify({passed:true,dialogues:128,slowTurns:512,immediateWithoutRestart:true,keyboard:true,widths:[320,390,630,1366],reloadPersistence:true,perTurn:true,transcript:true,otherSections:['words','sounds'],normalRatesRestored:true,exitResets:true,blockedStorageWorks:true,errors},null,2)+'\n');console.log('PASS 128 dialogues / 512 slow turns, live switching, refresh, other sections, reset, keyboard and blocked storage');
}finally{await browser.close();}
