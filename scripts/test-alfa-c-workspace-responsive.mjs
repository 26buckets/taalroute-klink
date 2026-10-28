import { chromium, webkit } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { dailyBlocks, dailyStorageKey } from '../lib/alfa-c-dagelijks.ts';
import { functionalBlocks, functionalStorageKey } from '../lib/alfa-c-functioneel.ts';
const base = process.env.KLINK_URL ?? 'http://127.0.0.1:18881';
const out = process.env.KLINK_WORKSPACE_OUTPUT ?? '/tmp/klink-workspace-review';
fs.mkdirSync(out, { recursive: true });
const checks = [];
for (const [engine, type] of Object.entries({ chromium, webkit })) {
 const browser = await type.launch();
 try {
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  await page.addInitScript(() => { window.Audio = class extends EventTarget { play() { this.t = setTimeout(() => this.dispatchEvent(new Event('ended')), 5); return Promise.resolve(); } pause() { clearTimeout(this.t); } }; });
  await page.goto(base + '/#learner/alfa-c');
  const cases = dailyBlocks.flatMap(b => {
   const worst = [...b.steps].sort((a,z) => z.speech.F.length - a.speech.F.length)[0];
   return b.steps.filter(s => s === worst || s.interaction !== 'keuze').map(s => ({ b, s, key: dailyStorageKey, kind: 'daily' }));
  }).concat(functionalBlocks.map(b => ({ b, s: [...b.steps].filter(s=>s.kind==='choice').sort((a,z)=>z.retryVisible.length-a.retryVisible.length)[0], key:functionalStorageKey, kind:'functional' })).filter(c=>c.s));
  for (const { b, s, key, kind } of cases) {
   await page.evaluate(({key,b,index})=>localStorage.setItem(key,JSON.stringify({version:1,positions:{[b]:index},records:{}})),{key,b:b.id,index:b.steps.indexOf(s)});
   await page.goto(base+`/#learner/alfa-c/${b.id}`);await page.reload();
   const player=page.locator(`[data-${kind}-step="${s.id}"]`);await player.waitFor();
   const idle=()=>page.waitForFunction(()=>!document.querySelector('.ac-support-tools button')?.disabled);
   const wrong = kind==='functional' ? s.options.find(o=>o.id!==s.correctOptionId) : s.options?.find(o=>!o.correct);
   if(wrong)await player.getByRole('button',{name:wrong.text,exact:true}).click();
   else for(const card of [...s.answerOrder].reverse()){await player.getByRole('button',{name:card,exact:true}).click();await idle();}
   await idle();
   const overflow=await player.evaluate(root=>{const top=root.querySelector('.pilot-footer').getBoundingClientRect().top;return [...root.querySelectorAll('.ac-document-paper,.ac-answer-panel button,.ac-answer-panel p,.ac-built-answer')].filter(e=>e.getBoundingClientRect().height).filter(e=>e.getBoundingClientRect().bottom>top+1).map(e=>e.textContent);});
   assert.deepEqual(overflow,[],s.id+' feedback fits');checks.push({engine,id:s.id,feedbackFits:true,width:1366,height:768});
  }
  // Long three-part example, materials, narrow source/answer views and short-screen reflow.
  for(const [width,height] of [[1280,800],[390,844],[320,568],[667,375]]){
   await page.setViewportSize({width,height});
   await page.evaluate(()=>localStorage.setItem('klink.alfa-c.functioneel.v1',JSON.stringify({version:1,positions:{lijst:9},records:{}})));
   await page.goto(base+'/#learner/alfa-c/lijst');await page.reload();await page.getByRole('button',{name:'Voorbeeld',exact:true}).click();
   if(width<=1100){for(const button of await page.locator('.ac-document-switch button').all()){await button.click();assert(await page.locator('.ac-document-slot[data-current="true"]').isVisible());}await page.getByRole('button',{name:'Opdracht',exact:true}).click();}
   const yours=page.getByRole('button',{name:'Nu jij',exact:true});await yours.scrollIntoViewIfNeeded();assert(await yours.isVisible());await yours.click();
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   await page.waitForFunction(()=>[...document.querySelectorAll('.ac-panel-switch button')].filter(e=>e.offsetHeight&&e.getAttribute('aria-pressed')==='true').every(e=>getComputedStyle(e).backgroundColor==='rgb(227, 238, 240)'));
   await page.screenshot({path:`${out}/${engine}-responsive-${width}.png`,fullPage:true});checks.push({engine,width,height,reflow:true});
  }
 }finally{await browser.close();}
}
fs.writeFileSync(`${out}/responsive.json`,JSON.stringify({checks},null,2));console.log(`PASS ${checks.length} feedback and responsive cases.`);
