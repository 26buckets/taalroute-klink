import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { chromium } from 'playwright';
import { availableChapterCollections, chapterHash } from '../lib/practice-chapters.ts';
import { functionalBlocks, functionalStorageKey } from '../lib/alfa-c-functioneel.ts';
const base = process.env.KLINK_TEST_URL || 'http://127.0.0.1:19215';
assert(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
const phase = process.env.KLINK_AUDIT_PHASE || 'before';
assert(['before', 'after'].includes(phase));
const out = 'outputs/ui-refinement-20261109/' + phase;
mkdirSync(out, { recursive: true });
const axePath = process.env.KLINK_AXE_PATH || '/tmp/klink-ui-a11y-20261109/package/axe.min.js';
const cases = [
  {name:'landing',route:'/',ready:'.entry-page'},
  {name:'home',route:'/#learner/home',ready:'.cp-home'},
  {name:'words',route:'/#learner/words',ready:'.cp-global-word-grid'},
  {name:'review',route:'/#learner/review',ready:'.honest-empty'},
  {name:'teacher',route:'/#teacher/plus',ready:'.kpd-lesson-choice'},
  {name:'worksheets',route:'/#teacher/materials',ready:'.kpd-worksheet-grid'},
  {name:'teacher-lesson',route:'/#teacher/plus',ready:'.kpd-lesson-choice',teacher:true},
];
for (const [chapter, activity, level] of [
  ['words','meet','alfa-a'],['words','same-word','alfa-a'],['spelling','build','alfa-b'],
  ['writing','dictation','alfa-a'],['writing','copy','alfa-a'],['grammar','verb-choice','alfa-a'],
  ['texts','text-question','b1'],['speaking','speak','a1'],['repeat','memory','alfa-a'],
]) {
  const collection = availableChapterCollections(activity, {level,help:'practice'}, {})[0];
  assert(collection, activity);
  cases.push({name:activity,route:'/'+chapterHash({chapter,activity,collection:collection.id,level,help:'practice'}),ready:'[data-exercise-id]'});
}
const block = functionalBlocks.find(b => b.steps.some(s => s.handwriting));
cases.push({name:'functional',route:'/#learner/alfa-c/'+block.id,ready:'[data-functional-step]',functional:true});
const browser = await chromium.launch();
const results = [], errors = [];
try {
  for (const width of phase === 'before' ? [1280, 390] : [1280, 640, 390, 320]) for (const item of cases) {
    const page = await browser.newPage({viewport:{width,height:width===640?450:width===320?568:width===390?844:900},reducedMotion:'reduce'});
    page.setDefaultTimeout(30000); page.on('pageerror', e=>errors.push({screen:item.name,width,message:e.message}));
    await page.goto(base+item.route);
    // Landing and empty states can finish their opening animation before the audit.
    if(item.name==='landing') await page.locator('.landing-start').waitFor();
    else if(item.name==='review') await page.getByRole('heading',{name:'Kies eerst een woord',exact:true}).waitFor();
    else await page.locator(item.ready).first().waitFor();
    if(item.teacher){await page.getByRole('button',{name:'Les openen: mat',exact:true}).click();await page.locator('.kpd-live').waitFor();}
    if(item.functional){
      await page.evaluate(({key,id,index})=>localStorage.setItem(key,JSON.stringify({version:1,positions:{[id]:index},records:{}})),{key:functionalStorageKey,id:block.id,index:block.steps.findIndex(s=>s.handwriting)});
      await page.reload();await page.locator(item.ready).waitFor();
    }
    await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(300);
    await page.addScriptTag({path:axePath});
    const accessibility = await page.evaluate(async()=> {
      const result=await window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']},resultTypes:['violations','incomplete']});
      return {version:window.axe.version,violations:result.violations.map(r=>({id:r.id,impact:r.impact,description:r.description,helpUrl:r.helpUrl,nodes:r.nodes.map(n=>({target:n.target,html:n.html,summary:n.failureSummary,checks:n.any}))})),incomplete:result.incomplete.map(r=>({id:r.id,nodes:r.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))};
    });
    const layout=await page.evaluate(()=>{
      const r=document.querySelector('.cp-exercise-stage,.kpd-stage')?.getBoundingClientRect();
      return {overflow:document.documentElement.scrollWidth>innerWidth+1,stage:r?{top:r.top,height:r.height}:null,
        counterInside:!document.querySelector('.pilot-head > div > span') || (()=>{const a=document.querySelector('.pilot-head').getBoundingClientRect(),b=document.querySelector('.pilot-head > div > span').getBoundingClientRect();return b.left>=a.left&&b.right<=a.right;})(),
        sourceHeight:document.querySelector('.ac-source-viewport')?.getBoundingClientRect().height??null,
        smallText:[...document.querySelectorAll('button small,button .cp-listen-caption')].filter(e=>e.getBoundingClientRect().height>0&&getComputedStyle(e).visibility!=='hidden').map(e=>({text:e.textContent,font:getComputedStyle(e).fontSize})),
      };
    });
    results.push({name:item.name,width,route:item.route,accessibility,layout});
    await page.screenshot({path:out+'/'+item.name+'-'+width+'.png'});
    console.log(width,item.name,accessibility.violations.map(v=>v.id).join(',')||'clear');
    await page.close();
  }
} finally {await browser.close();}
writeFileSync(out+'/audit.json',JSON.stringify({base,phase,axeSha256:createHash('sha256').update(readFileSync(axePath)).digest('hex'),results,errors},null,2));
if(phase==='after'){assert.deepEqual(errors,[]);assert(results.every(r=>!r.layout.overflow&&r.layout.counterInside),'No horizontal overflow or clipped step counter');assert(results.every(r=>r.accessibility.violations.length===0),'Resolve all detected WCAG violations');}

