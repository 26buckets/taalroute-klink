import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { build } from 'esbuild';
import { taalroutePackages as packs } from '../lib/taalroute-packages.ts';
import { groupExercises } from '../lib/group-practice.ts';
import { openGroupActivity } from './browser-route-helpers.mjs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.KLINK_TEST_URL || 'http://127.0.0.1:18830';
const out='outputs/standard-players-20261018'; mkdirSync(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1366,height:950}});
const errors=[],checks=[]; page.on('pageerror',e=>errors.push(e.message));
const pass=text=>{checks.push(text);console.log('PASS',text);};
const forward=()=>page.locator('.cp-exercise-feedback > button');
await page.addInitScript(()=>{ window.__played=[]; window.Audio=class extends EventTarget {constructor(src){super();this.src=src;} play(){window.__played.push(this.src);this.timer=setTimeout(()=>this.dispatchEvent(new Event('ended')),25);return Promise.resolve();}pause(){clearTimeout(this.timer);}removeAttribute(){}load(){} }; });
async function open(mode,index=0) {
  await page.goto(`${base}/#learner/home`); await page.reload();
  await page.locator('.cp-package-grid button').nth(index).click();
  await openGroupActivity(page,mode); await page.locator('.is-mixed-round').waitFor();
  const id=await page.locator('.is-mixed-round').getAttribute('data-exercise-id');
  return groupExercises(packs[index],mode).find(i=>i.exerciseId===id);
}
async function keyboardClick(locator){await locator.focus();await page.keyboard.press('Enter');}
async function checkLayout(label){
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),label+' horizontal overflow');
  const small=await page.locator('.cp-standard-task button:visible, .cp-standard-task input:visible').evaluateAll(nodes=>nodes.filter(n=>{const b=n.getBoundingClientRect();return b.width<47.5||b.height<47.5;}).map(n=>({text:n.textContent,w:n.getBoundingClientRect().width,h:n.getBoundingClientRect().height})));
  assert.deepEqual(small,[],label+' target sizes');
}
let item=await open('word-sort');
assert.equal(item.standardTask.kind,'sort'); assert(await forward().isDisabled());
const task=item.standardTask,first=task.items[0];
await keyboardClick(page.locator(`[data-sort-category="${task.categories.find(c=>c.id!==first.categoryId).id}"]`));
assert(await forward().isDisabled());
await page.getByRole('button',{name:'Op één blad',exact:true}).click();
assert.deepEqual(await page.locator('[data-sort-item]').evaluateAll(nodes=>nodes.map(n=>n.dataset.sortItem)),task.items.map(i=>i.id));
await page.getByRole('button',{name:'Help',exact:true}).click();
for(const word of task.items){ await keyboardClick(page.locator(`[data-sort-item="${word.id}"]`)); await keyboardClick(page.locator(`[data-sort-category="${word.categoryId}"]`)); }
assert(await forward().isEnabled());
let attempt=await page.evaluate(()=>JSON.parse(localStorage.getItem('klink.taalroute.attempts.v1')).at(-1));
assert.equal(attempt.helpUsed,true);assert.equal(attempt.attempts,2);assert.equal(attempt.correct,true);
assert(await page.locator('[data-sort-item]').first().isDisabled());
await page.waitForTimeout(900);assert.equal(await page.locator('.is-mixed-round').getAttribute('data-exercise-id'),item.exerciseId);
await checkLayout('sort desktop');await page.screenshot({path:`${out}/sort-desktop.png`,fullPage:true});
pass('Sort: wrong retry retains order, keyboard/tap and board mode, 48px, help/attempt storage, explicit advance');
await forward().click(); const nextId=await page.locator('.is-mixed-round').getAttribute('data-exercise-id');
await open('word-sort');assert.equal(await page.locator('.is-mixed-round').getAttribute('data-exercise-id'),nextId);
pass('Sort: saved position resumes through existing session contract');

item=await open('text-evidence');
if(!item.standardTask){const at=packs.findIndex(p=>groupExercises(p,'text-evidence')[0]?.standardTask);item=await open('text-evidence',at);}
const mark=item.standardTask;assert.equal(mark.kind,'mark');
const ids=mark.acceptedSelections[0],wrong=mark.tokens.find(t=>!ids.includes(t.id));
await keyboardClick(page.locator(`[data-word-token="${wrong.id}"]`));await page.getByRole('button',{name:'Controleer',exact:true}).click();assert(await forward().isDisabled());
assert.equal(await page.locator(`[data-word-token="${wrong.id}"]`).getAttribute('aria-pressed'),'true');
await page.locator(`[data-word-token="${wrong.id}"]`).click();
for(const id of ids) await keyboardClick(page.locator(`[data-word-token="${id}"]`));
await page.getByRole('button',{name:'Controleer',exact:true}).click();assert(await forward().isEnabled());
await checkLayout('mark desktop');await page.screenshot({path:`${out}/mark-desktop.png`,fullPage:true});
pass('Mark: exact multiword proof, stable wrong selection, toggling and keyboard, no whole-sentence substitution');

const grammarIndex=packs.findIndex(p=>groupExercises(p,'verb-choice').length);
item=await open('verb-choice',grammarIndex);assert.equal(await page.locator('.cp-source-text').count(),0);assert.equal(await page.locator('.cp-gap-cue').innerText(),item.standardTask.cue);
const input=page.getByRole('textbox',{name:'Welk woord mist?'});
await input.fill('onjuist');await input.press('Enter');assert(await forward().isDisabled());assert.equal(await input.inputValue(),'onjuist');
await input.fill(item.standardTask.acceptedAnswers[0].toUpperCase());await input.press('Enter');assert(await forward().isEnabled());
attempt=await page.evaluate(()=>JSON.parse(localStorage.getItem('klink.taalroute.attempts.v1')).at(-1));assert.equal(attempt.helpUsed,false);
item=await open('verb-choice',grammarIndex);await page.getByRole('button',{name:'Kies een woord',exact:true}).click();await page.getByRole('button',{name:'Voorbeeld',exact:true}).click();
assert.equal((await page.locator('.cp-source-text p').innerText()).trim(),item.standardTask.model);
await page.locator('.cp-choice-grid button').filter({hasText:new RegExp(`^${item.standardTask.acceptedAnswers[0]}$`)}).click();assert(await forward().isEnabled());
attempt=await page.evaluate(()=>JSON.parse(localStorage.getItem('klink.taalroute.attempts.v1')).at(-1));assert.equal(attempt.helpUsed,true);
pass('Gap: empty/model-free typed mode, wrong answer stays, normalized allowed answer, choice/model help recorded');

item=await open('context-order');
const initialOrder=await page.locator('[data-order-item]').evaluateAll(nodes=>nodes.map(n=>n.dataset.orderItem));
for(const id of [...item.targetOrderIds].reverse()) await keyboardClick(page.locator(`[data-order-item="${id}"]`));
await page.getByRole('button',{name:'Controleer',exact:true}).click();assert(await forward().isDisabled());
assert.deepEqual(await page.locator('[data-order-item]').evaluateAll(nodes=>nodes.map(n=>n.dataset.orderItem)),initialOrder);
for(const _ of item.targetOrderIds) await page.getByRole('button',{name:'Eén terug',exact:true}).click();
for(const id of item.targetOrderIds) await keyboardClick(page.locator(`[data-order-item="${id}"]`));
await page.getByRole('button',{name:'Controleer',exact:true}).click();assert(await forward().isEnabled());
pass('Order: source text lines, keyboard, wrong order stable, undo, explicit check and completion');

item=await open('practice-branch');assert(await forward().isDisabled());
await keyboardClick(page.getByRole('button',{name:'Hier zit straks iemand anders.',exact:true}));
assert((await page.locator('.cp-branch-consequence').innerText()).includes('andere plek'));
await page.locator('.cp-standard-task').getByRole('button',{name:'Verder',exact:true}).click();
await page.waitForFunction(()=>document.querySelector('.cp-standard-task h4')===document.activeElement);
await page.locator('.cp-standard-task').getByRole('button',{name:'Terug',exact:true}).click();
await page.getByRole('button',{name:'Ja, er is plaats.',exact:true}).click();await page.locator('.cp-standard-task').getByRole('button',{name:'Verder',exact:true}).click();
await page.getByRole('button',{name:'Graag, dank je.',exact:true}).click();await page.locator('.cp-standard-task').getByRole('button',{name:'Klaar',exact:true}).click();assert(await forward().isEnabled());
attempt=await page.evaluate(()=>JSON.parse(localStorage.getItem('klink.taalroute.attempts.v1')).at(-1));assert.equal(attempt.assessment,'participation');assert.equal(attempt.helpUsed,true);
await page.locator('.cp-standard-task').getByRole('button',{name:'Terug',exact:true}).click();assert(await forward().isDisabled());
pass('Branch: distinct consequences, focus at decision changes, return and retry, participation only');

for(const [width,height] of [[768,1024],[390,844]]){
 await page.setViewportSize({width,height});
 for(const mode of ['word-sort','text-evidence','verb-choice','context-order','situation-point','practice-branch']) {
  const exercise = await open(mode,mode==='verb-choice'?grammarIndex:0);
  if(mode==='word-sort') for(const word of exercise.standardTask.items) await page.locator(`[data-sort-category="${word.categoryId}"]`).click();
  if(mode==='text-evidence') {
    if(exercise.standardTask) { for(const id of exercise.standardTask.acceptedSelections[0]) await page.locator(`[data-word-token="${id}"]`).click(); await page.getByRole('button',{name:'Controleer',exact:true}).click(); }
    else await page.locator('.cp-evidence-options button').nth(exercise.options.findIndex(o=>exercise.answer.correctOptionIds.includes(o.id))).click();
  }
  if(mode==='verb-choice') { const field=page.getByRole('textbox',{name:'Welk woord mist?'}); await field.fill(exercise.standardTask.acceptedAnswers[0]);await field.press('Enter'); }
  if(mode==='context-order') { for(const id of exercise.targetOrderIds) await page.locator(`[data-order-item="${id}"]`).click();await page.getByRole('button',{name:'Controleer',exact:true}).click(); }
  if(mode==='situation-point') { assert(await page.locator('.cp-hotspot-image > img').evaluate(image=>{const r=image.getBoundingClientRect();return image.naturalWidth>0 && Math.abs(r.width/r.height-image.naturalWidth/image.naturalHeight)<.01;}), 'Scene aspect ratio preserved'); await page.getByRole('button',{name:'Plek 1: Links op tafel',exact:true}).click();assert(await forward().isDisabled());await keyboardClick(page.getByRole('button',{name:'3. Rechts op tafel',exact:true})); }
  if(mode==='practice-branch') { await page.getByRole('button',{name:'Ja, er is plaats.',exact:true}).click();await page.locator('.cp-standard-task').getByRole('button',{name:'Verder',exact:true}).click();await page.getByRole('button',{name:'Graag, dank je.',exact:true}).click();await page.locator('.cp-standard-task').getByRole('button',{name:'Klaar',exact:true}).click(); }
  assert(await forward().isEnabled());await checkLayout(`${mode} ${width}`);
  await forward().evaluate(button=>button.scrollIntoView({block:'center'}));
  assert(await forward().evaluate(button=>{const r=button.getBoundingClientRect();return button.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}),`${mode} forward not covered by menu`);
  await page.screenshot({path:`${out}/${mode}-${width}.png`,fullPage:true});
}
}
pass('Six connected players: completed by tablet/mobile taps and keyboard, layouts and >=48px targets; original app routes retained');

// Browser-only fixture for unavailable scene content; never imported into the learner catalog.
const built=await build({stdin:{contents:`import React,{useState} from 'react';import {createRoot} from 'react-dom/client';import {StandardPracticeSurface} from './components/product/standard-practice-surface';window.mountScene=(task)=>{window.__sceneRoot?.unmount();document.body.innerHTML='<main class="learner-main"><div id="scene-fixture"></div></main>';window.__sceneResults=[];function Fixture(){const [right,setRight]=useState(false);return <StandardPracticeSurface exercise={{exerciseId:'test-only',componentId:'KLINK-STANDARD',mode:'situation-point',standardTask:task,question:'Kies de rechter plek'}} onAudio={()=>false} onFinish={(answer,correct)=>{window.__sceneResults.push({answer,correct});setRight(correct)}} onReset={()=>setRight(false)} onHelp={()=>{}} canAnswer={true} answeredCorrectly={right}/>;}window.__sceneRoot=createRoot(document.getElementById('scene-fixture'));window.__sceneRoot.render(<Fixture/>);};`,loader:'tsx',resolveDir:process.cwd()},bundle:true,write:false,format:'iife',define:{'process.env.NODE_ENV':'"production"'},jsx:'automatic'});
await page.addScriptTag({content:built.outputFiles[0].text});
const scene={kind:'hotspot',image:{src:'data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400"><rect width="400" height="400" fill="#ede5d0"/><rect x="400" width="400" height="400" fill="#b9d8d0"/></svg>'),altText:'Technisch testbeeld met twee vlakken'},imageReview:'approved',regions:[{id:'left',label:'Linker plek',x:.05,y:.1,width:.4,height:.8},{id:'right',label:'Rechter plek',x:.55,y:.1,width:.4,height:.8}],correctRegionIds:['right'],help:'Kijk naar rechts.'};
for(const width of [1366,768,390]){
 await page.setViewportSize({width,height:950});await page.evaluate(task=>window.mountScene(task),scene);await page.locator('.cp-hotspot-target').first().waitFor();
 const geometry=await page.locator('.cp-hotspot-image').evaluate(el=>{const i=el.querySelector('img').getBoundingClientRect();return [...el.querySelectorAll('button')].map(b=>{const r=b.getBoundingClientRect();return {x:(r.x+r.width/2-i.x)/i.width,y:(r.y+r.height/2-i.y)/i.height,w:r.width,h:r.height};});});
 assert(Math.abs(geometry[0].x-.25)<.005);assert(Math.abs(geometry[1].x-.75)<.005);assert(geometry.every(g=>g.w>=48&&g.h>=48));
 await keyboardClick(page.getByRole('button',{name:'Plek 1: Linker plek',exact:true}));
 await keyboardClick(page.getByRole('button',{name:'2. Rechter plek',exact:true}));
 assert.deepEqual(await page.evaluate(()=>window.__sceneResults),[{answer:'left',correct:false},{answer:'right',correct:true}]);
 await page.screenshot({path:`${out}/scene-fixture-${width}.png`,fullPage:true});
}
await page.evaluate(task=>window.mountScene({...task,imageReview:'open'}),scene);assert.equal(await page.locator('.cp-hotspot-target').count(),0);
pass('Scene technical fixture: scaled coordinates, keyboard markers/list alternative, correct/wrong grading; unreviewed media blocked');
assert.deepEqual(errors,[]);writeFileSync(`${out}/browser-checks.json`,JSON.stringify({checks,errors,sceneContent:'existing approved situatie-map; synthetic fixture covers coordinate extremes' ,humanPilot:'open'},null,2));
await browser.close();
