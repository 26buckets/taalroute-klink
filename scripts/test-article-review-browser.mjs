import assert from 'node:assert/strict';
import {answerActivity} from './browser-route-helpers.mjs';
import {taalroutePackages,exercisesForLesson} from '../lib/taalroute-packages.ts';
import{chromium}from'playwright';
import{writeFileSync,mkdirSync}from'node:fs';
const out=process.env.KLINK_ARTICLE_REVIEW_OUTPUT||'../../outputs/klink-lidwoorden-review-20261025/local';mkdirSync(out,{recursive:true});
const base=process.env.KLINK_TEST_URL||'http://127.0.0.1:18833';
const b=await chromium.launch({channel:'chrome',headless:true});const p=await b.newPage();const checks=[],errors=[];p.on('pageerror',e=>errors.push(e.message));
try{
for(const role of ['learner','teacher'])for(const width of [1366,1100,768,390,320]){
 await p.setViewportSize({width,height:width===320?568:900});
 for(const group of ['groep-1','groep-4','groep-8','route-verbinden']){
  console.log('CHECK',role,width,group);await p.goto(`${base}/#${role}`);await p.goto(`${base}/#${role}/package/${group}`);await p.locator('.cp-tabs').getByRole('button',{name:'Woorden',exact:true}).click();await p.locator('.cp-word-grid').waitFor();
  const labels=await p.locator('.cp-word-grid .cp-word-article').evaluateAll(es=>es.map(el=>{let r=el.getBoundingClientRect(),c=el.closest('article').getBoundingClientRect(),s=getComputedStyle(el);return {text:el.textContent,font:parseFloat(s.fontSize),weight:s.fontWeight,color:s.color,fits:r.left>=c.left&&r.right<=c.right&&el.scrollWidth<=el.clientWidth+1}}));
  assert(labels.length);assert(labels.every(x=>x.fits&&x.font>=16&&x.font<=18&&x.weight==='400'),JSON.stringify({role,width,group,labels}));
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  if(group==='groep-4')assert(labels.some(x=>x.text==='het bed'));
  if(group==='groep-8'){assert(labels.some(x=>x.text==='het haar'));assert(!labels.some(x=>x.text==='de bij'||x.text==='het bij'));}
  if(group==='route-verbinden'){assert(labels.some(x=>x.text==='de aardappel'));assert(labels.some(x=>x.text==='de koekjes'));}
  checks.push({role,width,group,labels:labels.length,fit:true});
 }
 await p.goto(`${base}/#${role}/package/groep-1`);await p.locator('.cp-tabs').getByRole('button',{name:'Stap voor stap',exact:true}).click();await p.locator('.cp-start-lesson').first().click();await p.locator('.cp-model-content .cp-word-article').waitFor();
 const a=p.locator('.cp-model-content .cp-word-article');assert.equal(await a.innerText(),'de mat');const box=await a.boundingBox();assert(box.width>20&&box.x>=0&&box.x+box.width<=width);assert(await a.evaluate(el=>{const r=el.getBoundingClientRect(),stage=el.closest('.cp-exercise-stage'),b=stage.getBoundingClientRect();return b.height>=120&&r.left>=b.left&&r.right<=b.right&&stage.scrollWidth<=stage.clientWidth+1;}),'Introduction fits the actual exercise stage');if(role==='teacher'){const f=await p.locator('.cp-exercise-feedback').boundingBox();assert(f.y+f.height<=(width===320?568:900),JSON.stringify(f));}
 await a.scrollIntoViewIfNeeded();
 assert(await a.evaluate(el=>{const r=el.getBoundingClientRect(),s=el.closest('.cp-exercise-stage').getBoundingClientRect();return r.top>=s.top&&r.bottom<=s.bottom;}),'Article is actually visible after scrolling');
 if((role==='teacher'&&(width===1366||width===390))||(role==='learner'&&width===390))await p.screenshot({path:`${out}/meet-${role}-${width}.png`});
 for(const e of exercisesForLesson(taalroutePackages[0],taalroutePackages[0].lessons[0])){if(e.componentId!=='ALF-CMP-001')assert.equal(await p.locator('.cp-exercise-stage .cp-word-article').count(),0);await answerActivity(p,e,{checkFocus:false});}
 checks.push({role,width,view:'meet-and-complete-lesson',fit:true});
}
assert.deepEqual(errors,[]);writeFileSync(`${out}/layout-review.json`,JSON.stringify({status:'passed',checks,errors},null,2));console.log('PASS',checks.length,'learner/teacher layout states');
}finally{await b.close();}
