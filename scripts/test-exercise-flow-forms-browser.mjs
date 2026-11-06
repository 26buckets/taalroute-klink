import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium, webkit } from 'playwright';
import { contentPackages } from '../lib/package-content.ts';
import { chapterCollections } from '../lib/practice-chapters.ts';
import { groupActivities } from '../lib/group-practice.ts';
const base=process.env.KLINK_TEST_BASE||'http://127.0.0.1:18996',out='outputs/exercise-flow-20261106';
mkdirSync(out,{recursive:true});
const cases=new Map(),results=[],errors=[];
function add(pack,e){const key=[e.componentId,e.mode,e.standardTask?.kind,e.standardTask?.basis,e.contentTask?.teacherWorkflow?.kind,e.contentTask?.mode].filter(Boolean).join('/');if(!cases.has(key))cases.set(key,{key,exercise:e,pack:{...pack,exercises:[e]}});}
for(const a of groupActivities)for(const c of chapterCollections(a.id))for(const e of c.exercises)add(c.pack,e);
for(const p of contentPackages)for(const e of p.exercises)add(p,e);
for(const [engine,type]of Object.entries({chromium,webkit})){
 const b=await type.launch(engine==='chromium'?{channel:'chrome'}:{});
 try{
 const p=await b.newPage();p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/flow-audit',r=>r.fulfill({contentType:'text/html',body:'<html><body></body></html>'}));
 await p.goto(base+'/flow-audit');await p.evaluate(async()=>{
 const{default:refresh}=await import('/@react-refresh');refresh.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;
 for(const file of ['globals','learner-ui','learner-layout','exercise-flow','motion'])await import('/app/'+file+'.css');
 await import('/scripts/keyboard-test-fixture.tsx');document.body.classList.add('klink-motion');
 });
 // Move the fixture root into the real learner frame after each render; the production CSS stays loaded.
 for(const [width,height]of [[1366,768],[390,844],[320,568]]){
 await p.setViewportSize({width,height});
 for(const c of cases.values()){
 await p.evaluate(c=>window.keyboardMount(c.pack,c.exercise),c);
 await p.locator(`[data-exercise-id="${c.exercise.exerciseId}"]`).waitFor();
 await p.evaluate(()=>{const host=document.querySelector('#keyboard-audit');if(!host.closest('.learner-app')){const outer=document.createElement('div');outer.className='product-root';outer.innerHTML='<div class="learner-app consistent-layout"><aside class="learner-nav"></aside><main class="learner-main"></main></div>';document.body.append(outer);outer.querySelector('main').append(host);}});
 await p.waitForTimeout(80);
 const metrics=await p.evaluate(()=>{
 const stage=document.querySelector('.cp-exercise-stage'),main=document.querySelector('.learner-main');
 const clipped=[...stage.querySelectorAll('*')].filter(e=>{const s=getComputedStyle(e);return ['auto','scroll','hidden'].includes(s.overflowY)&&e.clientHeight>0&&e.scrollHeight>e.clientHeight+3&&!e.matches('textarea,select,input,.sr-only');}).map(e=>({cls:e.className,h:e.clientHeight,scroll:e.scrollHeight}));
 return{horizontal:main.scrollWidth>main.clientWidth+2,inner:stage.scrollHeight>stage.clientHeight+3,clipped};});
 if(metrics.horizontal||metrics.inner||metrics.clipped.length)console.log('LAYOUT',engine,width,c.key,JSON.stringify(metrics));
 results.push({engine,width,form:c.key,...metrics});
 }
 }
 }finally{await b.close();writeFileSync(out+'/forms.json',JSON.stringify({forms:cases.size,results,errors},null,2));}
}
assert.deepEqual(errors,[]);
assert(results.every(r=>!r.horizontal&&!r.inner&&!r.clipped.length),'Every representative form fits its natural content height');
console.log('PASS',cases.size,'forms',results.length,'layouts');
