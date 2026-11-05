import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {build} from 'esbuild';
import {taalroutePackages as packs} from '../lib/taalroute-packages.ts';
import {groupExercises} from '../lib/group-practice.ts';
import {chapterCollections,chapterHash,practiceChapters} from '../lib/practice-chapters.ts';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const out='outputs/standard-integration-20261018';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1366,height:950}});
const base=process.env.KLINK_TEST_URL||'http://127.0.0.1:18830', errors=[], checks=[];
page.on('pageerror',e=>errors.push(e.message));
try {
for(const mode of ['word-sort','text-evidence','verb-choice','context-order','situation-point','practice-branch']){
 // Retain the original expanded collection fixture; deferred banks are exercised by test-production-browser.
 const collections=chapterCollections(mode).filter(c=>!c.contentUrl), collection=collections.at(-1);
 const chapter=practiceChapters.find(c=>c.activities.includes(mode));
 await page.goto(base+'/'+chapterHash({chapter:chapter.id,activity:mode,collection:collection.id,level:collection.level}));await page.reload();
 await page.locator('.is-mixed-round').waitFor();
 const id=await page.locator('.is-mixed-round').getAttribute('data-exercise-id');
 assert(collection.exercises.some(e=>e.exerciseId===id));
 checks.push(`Existing chapter deep link reaches expanded ${mode} collection ${collection.id}`);
}
// Check the actual narrow app frame as well as the reusable-renderer fixtures below.
await page.setViewportSize({width:320,height:844});
for(const collection of chapterCollections('situation-point')) {
 await page.goto(base+'/'+chapterHash({chapter:'practical',activity:'situation-point',collection:collection.id,level:collection.level}));await page.reload();
 for(const exercise of collection.exercises) {
  await page.locator(`[data-exercise-id="${exercise.exerciseId}"]`).waitFor();
  await page.locator('.cp-hotspot-target').first().waitFor();
  const boxes=await page.locator('.cp-hotspot-target').evaluateAll(nodes=>nodes.map(n=>{const b=n.getBoundingClientRect();return {left:b.left,right:b.right,top:b.top,bottom:b.bottom};}));
  for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const a=boxes[i],b=boxes[j];assert(a.right<=b.left||b.right<=a.left||a.bottom<=b.top||b.bottom<=a.top,`Actual 320px app frame: overlapping ${String(exercise.contextId)} markers ${i}/${j}`);}
  const at=exercise.standardTask.regions.findIndex(r=>exercise.standardTask.correctRegionIds.includes(r.id));
  await page.locator('.cp-hotspot-target').nth(at).click();
  await page.screenshot({path:`${out}/actual-${String(exercise.contextId)}-${String(exercise.collectionVariant)}-320.png`,fullPage:true});
  await page.locator('.cp-exercise-feedback > button').click();
 }
}
checks.push('All eight real scene tasks within the actual 320px app frame: separate targets and successful continuation');
// Exercise every actual scene target and the newly authored conversation paths in the shared renderer.
const built=await build({stdin:{contents:`import React,{useState} from 'react';import{createRoot}from'react-dom/client';import{ExerciseSurface}from'./components/product/package-exercise-browser';window.mount=(exercise)=>{window.root?.unmount();document.body.innerHTML='<main class="learner-main"><div id="fixture"></div></main>';window.results=[];function Fixture(){const[right,setRight]=useState(false);return <ExerciseSurface exercise={exercise} pack={{words:[],exercises:[]}} onAudio={()=>false} onFinish={(answer,correct)=>{window.results.push({answer,correct});setRight(correct)}} onReset={()=>setRight(false)} onHelp={()=>{}} canAnswer={true} answeredCorrectly={right} onOpenExercise={()=>{}} guided={true} speakingOptionId=""/>;}window.root=createRoot(document.getElementById('fixture'));window.root.render(<Fixture/>);};`,resolveDir:process.cwd(),loader:'tsx'},bundle:true,loader:{'.css':'empty'},alias:{'next/image':process.cwd()+'/node_modules/vinext/dist/shims/image.js'},format:'iife',write:false,jsx:'automatic',define:{'process.env':'{}','process.env.NODE_ENV':'"production"'}});
await page.addScriptTag({content:built.outputFiles[0].text});
const scenes=chapterCollections('situation-point').flatMap(c=>c.exercises);
for(const width of [1366,768,390,320]){
 await page.setViewportSize({width,height:950});
 for(const exercise of scenes){
  await page.evaluate(e=>window.mount(e),exercise);await page.locator('.cp-hotspot-target').first().waitFor();
  const geometry=await page.locator('.cp-hotspot-image').evaluate(el=>{const image=el.querySelector('img'),r=image.getBoundingClientRect();const markers=[...el.querySelectorAll('button')].map(b=>{const p=b.getBoundingClientRect();return {left:p.left,top:p.top,right:p.right,bottom:p.bottom,width:p.width,height:p.height};});return {ratio:r.width/r.height,naturalRatio:image.naturalWidth/image.naturalHeight,markers};});
  assert(Math.abs(geometry.ratio-geometry.naturalRatio)<.01);
  assert(geometry.markers.every(m=>m.width>=48&&m.height>=48));
  for(let i=0;i<geometry.markers.length;i++)for(let j=i+1;j<geometry.markers.length;j++){const a=geometry.markers[i],b=geometry.markers[j];assert(a.right<=b.left||b.right<=a.left||a.bottom<=b.top||b.bottom<=a.top,`${width}: overlapping ${String(exercise.contextId)} markers ${i}/${j}`);}
  const at=exercise.standardTask.regions.findIndex(r=>exercise.standardTask.correctRegionIds.includes(r.id));
  await page.locator('.cp-hotspot-target').nth(at).click();assert.equal((await page.evaluate(()=>window.results)).at(-1).correct,true);
  if(exercise.collectionVariant==='klink-woord-pan'||exercise.collectionVariant==='klink-woord-map')await page.screenshot({path:`${out}/${String(exercise.contextId)}-${width}.png`,fullPage:true});
 }
 checks.push(`All eight real scene tasks: full images, nonoverlapping 48px targets and correct answers at ${width}px`);
}
for(const collection of chapterCollections('practice-branch'))for(const exercise of collection.exercises.filter(e=>e.standardTask.start==='start')){
 await page.evaluate(e=>window.mount(e),exercise);const task=exercise.standardTask;
 await page.getByRole('button',{name:task.nodes[0].choices[1].label,exact:true}).click();
 await page.locator('.cp-standard-task').getByRole('button',{name:'Verder',exact:true}).click();
 const node=task.nodes.find(n=>n.id==='alternative');await page.getByRole('button',{name:node.choices[0].label,exact:true}).click();
 await page.locator('.cp-standard-task').getByRole('button',{name:'Klaar',exact:true}).click();assert.equal((await page.evaluate(()=>window.results)).at(-1).correct,true);
}
checks.push('All fifteen added conversations: source-specific alternate path reaches explicit completion');
const evidence=packs.flatMap(p=>groupExercises(p,'text-evidence')).find(e=>e.title==='Tik op alle woorden van de zin met het antwoord.');
await page.evaluate(e=>window.mount(e),evidence);for(const id of evidence.standardTask.acceptedSelections[0])await page.locator(`[data-word-token="${id}"]`).click();await page.getByRole('button',{name:'Controleer',exact:true}).click();assert.equal((await page.evaluate(()=>window.results)).at(-1).correct,true);
checks.push('Nonliteral source answer: select complete evidence sentence, with matching instruction');
assert.deepEqual(errors,[]);writeFileSync(`${out}/integration-browser.json`,JSON.stringify({checks,errors},null,2));console.log(checks.join('\n'));
} finally {await browser.close();}
