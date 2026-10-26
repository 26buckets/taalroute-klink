import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
const {chromium}=await import('/Users/nicoknoester/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const data=JSON.parse(readFileSync('data/klink-dialogue-repair.json')).dialogues;
const base=process.env.KLINK_TEST_URL||'http://localhost:18928';
const out=process.env.KLINK_DIALOGUE_OUTPUT||'outputs/dialogue-playback';mkdirSync(out,{recursive:true});
const b=await chromium.launch({headless:true}),p=await b.newPage();const errors=[],checks=[];p.on('pageerror',e=>errors.push(e.message));
await p.addInitScript(()=>{window.__plays=[];window.__ended=[];window.__duration=40;window.Audio=class extends EventTarget{constructor(src){super();this.src=src;this.paused=true;}play(){window.__plays.push(this.src);this.paused=false;this.timer=setTimeout(()=>{this.paused=true;window.__ended.push(this.src);this.dispatchEvent(new Event('ended'));},window.__duration);return Promise.resolve();}pause(){clearTimeout(this.timer);this.paused=true;}};});
const button=name=>p.getByRole('button',{name,exact:true});
async function open(d){await p.goto(`${base}/#learner/chapters/practical/dialogues/${d.id}?level=${d.sourceLevel.toLowerCase()}`);await p.waitForFunction(id=>document.querySelector('.cp-exercise-browser')?.dataset.exerciseId.includes(id),d.id);await p.locator('.cp-dialogue').waitFor();}
async function clear(){await p.evaluate(()=>{window.__plays=[];window.__ended=[];});}
async function whole(d){await clear();await button('Luister naar het gesprek').click();await p.waitForFunction(()=>window.__ended.length===4);assert.deepEqual(await p.evaluate(()=>window.__plays),d.turns.map(t=>t.src));await p.waitForFunction(()=>document.querySelector('.cp-dialogue-position')?.textContent==='4 / 4');assert.equal(await p.locator('.cp-dialogue-current h3').innerText(),d.turns[3].speaker);}
try{
 const pilot=data.find(d=>d.id==='klink-dialogue-32f962399de8f4c3');
 for(const width of [1366,630,390,320]){
  await p.setViewportSize({width,height:900});await p.goto(base);await open(pilot);await clear();await p.waitForTimeout(150);
  assert.equal((await p.evaluate(()=>window.__plays)).length,0,'Opening never starts audio');
  assert.equal(await button('Hele gesprek').getAttribute('aria-pressed'),'true');
  assert.equal(await p.locator('.cp-dialogue').getByText(/Alfa [BC]/).count(),0);
  assert.equal(await p.locator('.cp-dialogue-current').getByText(pilot.turns[0].text,{exact:true}).count(),0);
  assert(await button('Ronde afronden').isDisabled());
  await button('Oefen per beurt').click();await button('Luister naar deze beurt').click();await p.waitForFunction(()=>window.__ended.length===1);
  assert.deepEqual(await p.evaluate(()=>window.__plays),[pilot.turns[0].src]);assert(await button('Ronde afronden').isDisabled());
  await button('Volgende spreekbeurt').click();await button('Meelezen').click();assert.equal(await p.locator('.cp-dialogue-current p').innerText(),pilot.turns[1].text);
  await clear();await button('Luister naar deze beurt').click();await p.waitForFunction(()=>window.__ended.length===1);assert.deepEqual(await p.evaluate(()=>window.__plays),[pilot.turns[1].src]);
  await button('Hele gesprek').click();await whole(pilot);assert(await button('Ronde afronden').isEnabled());
  await p.evaluate(()=>window.__duration=200);await clear();await button('Luister naar het gesprek').click();await p.waitForTimeout(40);await button('Pauze').click();const count=(await p.evaluate(()=>window.__plays)).length;await p.waitForTimeout(300);assert.equal((await p.evaluate(()=>window.__plays)).length,count);
  await clear();await button('Luister naar het gesprek').click();await p.waitForTimeout(40);await button('Oefen per beurt').click();await p.waitForTimeout(300);assert.equal((await p.evaluate(()=>window.__plays)).length,1,'Changing mode stops the sequence');
  await p.evaluate(()=>window.__duration=40);await p.locator('summary').filter({hasText:'Hele gesprek meelezen'}).click();assert.equal(await p.locator('.cp-dialogue-transcript > button').count(),4);await clear();await button('Luister naar beurt 1 van Sara').click();await p.waitForFunction(()=>window.__ended.length===1);assert.deepEqual(await p.evaluate(()=>window.__plays),[pilot.turns[0].src]);
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await p.screenshot({path:`${out}/${width}.png`});
  await open(data.find(d=>d.id==='klink-dialogue-d0a263adf67c1b3c'));assert.equal(await button('Hele gesprek').getAttribute('aria-pressed'),'true');assert.equal(await button('Meelezen').getAttribute('aria-pressed'),'false');
 }
 await p.setViewportSize({width:390,height:900});
 for(const d of data){await open(d);await clear();assert.equal(await button('Hele gesprek').getAttribute('aria-pressed'),'true');assert.equal(await button('Luister naar het gesprek').count(),1);await whole(d);checks.push(d.id);}
 assert.deepEqual(errors,[]);writeFileSync(`${out}/results.json`,JSON.stringify({passed:true,wholeConversationDefaults:checks.length,ids:checks,widths:[1366,630,390,320],noAutoplay:true,perTurn:true,optionalText:true,modeReset:true,pauseAndModeSwitch:true,errors},null,2)+'\n');console.log('PASS all 128 whole-conversation defaults and ordered four-turn playback; per-turn, text, pause, mode reset, responsive controls');
}finally{await b.close();}
