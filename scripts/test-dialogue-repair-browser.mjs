import assert from 'node:assert/strict';
import { mkdirSync,writeFileSync } from 'node:fs';
const {chromium}=await import('/Users/nicoknoester/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const b=await chromium.launch({headless:true});const p=await b.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.addInitScript(()=>{window.__plays=[];window.__fail='';window.Audio=class extends EventTarget{constructor(src){super();this.src=src;this.paused=true;} play(){window.__plays.push(this.src);if(this.src===window.__fail)return Promise.reject(Error('test failure'));this.paused=false;this.timer=setTimeout(()=>{this.paused=true;this.dispatchEvent(new Event('ended'));},200);return Promise.resolve();} pause(){clearTimeout(this.timer);this.paused=true;}};});
const url=(process.env.KLINK_TEST_URL||'http://localhost:18925')+'/#learner/chapters/practical/dialogues/klink-dialogue-32f962399de8f4c3?level=a2';const out=process.env.KLINK_DIALOGUE_OUTPUT||'outputs/dialogue-browser';mkdirSync(out,{recursive:true});
try{
 for(const width of [1366,390,320]){
  await p.setViewportSize({width,height:900});await p.goto(url);await p.reload();await p.locator('.cp-dialogue').waitFor();
  await p.waitForTimeout(400);assert.equal((await p.evaluate(()=>window.__plays)).length,0,'No unsolicited autoplay');
  assert.equal(await p.locator('.cp-dialogue-current h3').innerText(),'Sara');
  assert.equal(await p.locator('.cp-dialogue-current').getByText('Er is geen kool meer in de winkel. Zal ik wortels meenemen?').count(),0);
  await p.getByRole('button',{name:'Meelezen',exact:true}).click();assert.match(await p.locator('.cp-dialogue-current p').innerText(),/Er is geen kool/);
  await p.getByRole('button',{name:'Deze beurt',exact:true}).click();await p.waitForTimeout(300);assert.equal((await p.evaluate(()=>window.__plays)).length,1,'First turn is not the entire sequence');
  assert(await p.getByRole('button',{name:'Ronde afronden',exact:true}).isDisabled());
  await p.getByRole('button',{name:'Volgende spreekbeurt',exact:true}).click();assert.equal(await p.locator('.cp-dialogue-current h3').innerText(),'Daan');
  await p.getByRole('button',{name:'Hele gesprek',exact:true}).click();await p.waitForTimeout(1100);assert.equal(await p.locator('.cp-dialogue-current h3').innerText(),'Daan');assert(await p.getByRole('button',{name:'Ronde afronden',exact:true}).isEnabled());
  assert.equal((await p.evaluate(()=>window.__plays)).length,5);
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await p.screenshot({path:`${out}/${width}.png`});
  await p.getByRole('button',{name:'Hele gesprek',exact:true}).click();await p.waitForTimeout(50);await p.getByRole('button',{name:'Pauze',exact:true}).click();const count=(await p.evaluate(()=>window.__plays)).length;await p.waitForTimeout(600);assert.equal((await p.evaluate(()=>window.__plays)).length,count,'Pause cancels sequence');
  await p.locator('summary').filter({hasText:'Hele gesprek meelezen'}).click();assert.equal(await p.locator('.cp-dialogue-transcript > button').count(),4);await p.getByRole('button',{name:'Luister naar beurt 1 van Sara',exact:true}).click();await p.waitForTimeout(300);assert.equal((await p.evaluate(()=>window.__plays)).length,count+1);
  await p.evaluate(()=>{window.__plays=[];});
 }
 assert.deepEqual(errors,[]);writeFileSync(`${out}/results.json`,JSON.stringify({passed:true,widths:[1366,390,320],errors},null,2));console.log('PASS dialogue playback, stop, single turns, transcript, responsive layout');
}finally{await b.close();}
