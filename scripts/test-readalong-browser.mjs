import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
const {chromium}=await import('/Users/nicoknoester/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const dialogues=JSON.parse(readFileSync('data/klink-dialogue-repair.json')).dialogues;
const base=process.env.KLINK_TEST_URL||'http://localhost:18931';const out=process.env.KLINK_READALONG_OUTPUT||'outputs/readalong';mkdirSync(out,{recursive:true});
const browser=await chromium.launch();const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{window.__plays=[];window.__ended=[];window.__duration=40;window.__fail='';window.Audio=class extends EventTarget{constructor(src){super();this.src=src;}play(){window.__plays.push(this.src);if(this.src===window.__fail)return Promise.reject(Error('unavailable'));this.timer=setTimeout(()=>{window.__ended.push(this.src);this.dispatchEvent(new Event('ended'));},window.__duration);return Promise.resolve();}pause(){clearTimeout(this.timer);}};});
const button=name=>page.getByRole('button',{name,exact:true});
async function open(d){await page.goto(`${base}/#learner/chapters/practical/dialogues/${d.id}?level=${d.sourceLevel.toLowerCase()}`);await page.waitForFunction(id=>document.querySelector('.cp-exercise-browser')?.dataset.exerciseId.includes(id),d.id);await page.locator('.cp-dialogue').waitFor();}
async function selected(on){assert.equal(await button(on?'Tekst verbergen':'Meelezen').getAttribute('aria-pressed'),String(on));}
async function complete(d,on){await page.evaluate(()=>{window.__plays=[];window.__ended=[];});await button('Luister naar het gesprek').click();await selected(on);await page.waitForFunction(()=>window.__ended.length===4);assert.deepEqual(await page.evaluate(()=>window.__ended),d.turns.map(t=>t.src));}
try{
 await page.setViewportSize({width:390,height:844});
 for(const d of dialogues){await open(d);await selected(true);assert.equal(await page.locator('.cp-dialogue-current p').innerText(),d.turns[0].text);await complete(d,true);await complete(d,false);await button('Meelezen').click();await complete(d,true);}
 const pilot=dialogues.find(d=>d.id==='klink-dialogue-d0a263adf67c1b3c');
 for(const width of [320,630,1366]){
  await page.goto(base);await open(pilot);await page.setViewportSize({width,height:900});
  await selected(true);await page.evaluate(()=>window.__duration=500);await button('Luister naar het gesprek').click();await button('Pauze').click();await selected(true);await page.evaluate(()=>window.__duration=40);await complete(pilot,true);
  await page.locator('.cp-dialogue-transcript summary').click();assert(await page.locator('.cp-dialogue-transcript').evaluate(e=>e.open));await complete(pilot,false);assert.equal(await page.locator('.cp-dialogue-transcript').evaluate(e=>e.open),false);
  await button('Meelezen').focus();await page.keyboard.press('Enter');await selected(true);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:`${out}/readalong-${width}.png`});
 }
 await page.goto(base);await open(pilot);await button('Oefen per beurt').click();
 for(let i=0;i<2;i++){const before=await page.evaluate(()=>window.__ended.length);await button('Luister naar deze beurt').click();await page.waitForFunction(n=>window.__ended.length>n,before);await selected(true);}
 await button('Hele gesprek').click();await complete(pilot,true);await complete(pilot,false);
 await page.goto(base);await open(pilot);await button('Tekst verbergen').click();await complete(pilot,false);await button('Meelezen').click();await selected(true);
 // Failed first playback and the separate retry button do not consume the first full round.
 await page.goto(base);await open(pilot);await page.evaluate(src=>window.__fail=src,pilot.turns[1].src);await button('Luister naar het gesprek').click();await button('Opnieuw luisteren').waitFor();await selected(true);await page.evaluate(()=>{window.__fail='';window.__ended=[];});await button('Opnieuw luisteren').click();await page.waitForFunction(()=>window.__ended.length===4);await selected(true);await complete(pilot,false);
 await open(dialogues.find(d=>d.id!==pilot.id));await selected(true);await open(pilot);await selected(true);
 assert.deepEqual(errors,[]);writeFileSync(`${out}/results.json`,JSON.stringify({passed:true,dialogues:128,firstWithText:128,secondWithoutText:128,thirdManualChoice:128,abortKeepsFirstRound:true,individualTurnsNotCounted:true,retryCountsCompletedRound:true,manualHideBeforeFirst:true,transcriptClosesOnSecond:true,newConversationResets:true,keyboard:true,widths:[320,390,630,1366],errors},null,2)+'\n');console.log('PASS all 128 first/second/manual-third rounds, abort, single turns, retry, reset and keyboard');
}finally{await browser.close();}
