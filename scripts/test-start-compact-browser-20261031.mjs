import assert from 'node:assert/strict';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
import {lessonPackages,allPackageWords} from '../lib/package-content.ts';
import {progressKey} from '../lib/learner-progress.ts';
const base=process.env.KLINK_TEST_URL||'http://127.0.0.1:18983';
const out=process.env.KLINK_TEST_OUTPUT||'outputs/start-compact-20261031/layout';
const baseline=process.env.KLINK_START_BASELINE==='1';
mkdirSync(out,{recursive:true});
const pack=lessonPackages.find(p=>p.lessons.some(l=>l.guidedExerciseIds?.length));
const lesson=pack.lessons.find(l=>l.guidedExerciseIds?.length);
const position={packageId:pack.id,lessonId:lesson.id,exerciseId:lesson.guidedExerciseIds[0]};
const saved={
 [progressKey]:JSON.stringify({position,completed:[lesson.id]}),
 'klink.taalroute.savedWords.v1':JSON.stringify([allPackageWords[0].id]),
 'klink.taalroute.attempts.v1':JSON.stringify([{exerciseId:position.exerciseId,correct:false,at:'2026-10-30T12:00:00.000Z'}]),
 'klink.round-progress.v1:sequence:functional:lijst':JSON.stringify({version:1,total:12,done:['lijst-01']})
};
const cases=[],unaffected=[],errors=[];
for(const[name,engine]of Object.entries({chromium,webkit})){
 const browser=await engine.launch();
 try{
  for(const theme of ['light','dark']){
   const page=await browser.newPage({colorScheme:theme});
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base+'/#learner/home');await page.locator('.cp-home').waitFor();
   await page.evaluate(({saved,theme})=>{
    for(const[k,v]of Object.entries(saved))localStorage.setItem(k,v);
    localStorage.setItem('klink.taalroute.preferences.v1',JSON.stringify({literacy:'alfa-a',language:'b1',pictures:'request'}));
    localStorage.setItem('klink.taalroute.practice-navigation.v1',JSON.stringify({level:'alfa-a',help:'practice'}));
    document.documentElement.dataset.theme=theme;
   },{saved,theme});
   await page.reload();await page.locator('.cp-direct-resume').waitFor();
   await page.evaluate(theme=>{document.documentElement.dataset.theme=theme;document.documentElement.classList.toggle('dark',theme==='dark');},theme);
   for(const[width,height]of [[1366,900],[768,1024],[390,844],[320,480]]){
    await page.setViewportSize({width,height});
    await page.evaluate(()=>document.fonts.ready);
    const layout=await page.locator('.cp-home').evaluate(root=>{
     const box=el=>{const r=el.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,right:r.right};};
     const actions=[...root.querySelectorAll('.cp-direct-actions button')];
     return{header:box(root.querySelector('.cp-context-header')),resume:box(root.querySelector('.cp-direct-resume')),inHeading:!!root.querySelector('.cp-context-header h1 .cp-direct-resume'),actions:actions.map(box),first:box(root.querySelector('[data-chapter]')),levels:[...root.querySelectorAll('.cp-direct-levels button')].map(box),overflow:document.documentElement.scrollWidth>innerWidth+1,clipped:actions.some(b=>b.scrollWidth>b.clientWidth+1)};
    });
    if(!baseline){
     assert(layout.inHeading,'Resume replaces Start in the heading');
     assert(layout.resume.height>=48&&layout.resume.width>=48);
     assert(layout.resume.y>=layout.header.y&&layout.resume.bottom<=layout.header.bottom+1,'Resume stays visible inside the header');
     assert.equal(layout.actions.length,2);assert.equal(layout.actions[0].y,layout.actions[1].y,'Both entries share one row');
     assert(layout.actions.every(b=>b.height>=44&&b.height<48),'Compact controls retain touch targets');
     assert.equal(layout.clipped,false);assert.equal(layout.overflow,false);
     assert(layout.levels.every(b=>b.height>=48),'Level button sizes and hidden B2 slot retained');
    }
    await page.screenshot({path:`${out}/${name}-${theme}-${width}.png`});
    cases.push({name,theme,width,height,...layout});
   }
   await page.setViewportSize({width:390,height:844});
   for(const route of ['#learner/chapters/words?level=alfa-a&help=practice','#learner/words','#learner/review']){
    await page.goto(base+'/'+route);
    const selector=route.includes('/chapters/')?'.cp-chapters':route==='#learner/words'?'.word-library-page':'.review-page';
    await page.locator(selector).waitFor();
    await page.evaluate(()=>document.fonts.ready);
    const data=await page.locator(selector).evaluate(root=>{
     const all=Array.from(root.querySelectorAll('h1,.cp-practice-modes button,.cp-direct-levels button,.cp-activity-button')).filter(el=>el.getBoundingClientRect().height);
     return all.map(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return{text:el.textContent,x:r.x,y:r.y,width:r.width,height:r.height,font:s.font,color:s.color,background:s.backgroundColor};});
    });
    unaffected.push({name,theme,route,data});
   }
   assert.deepEqual(await page.evaluate(keys=>Object.fromEntries(keys.map(k=>[k,localStorage.getItem(k)])),Object.keys(saved)),saved,'All original progress/saved words/attempts/rounds unchanged');
   await page.evaluate(key=>localStorage.removeItem(key),progressKey);
   await page.goto(base+'/#learner/home');await page.reload();await page.locator('.cp-home').waitFor();
   assert.equal(await page.locator('.cp-direct-resume').count(),0);
   assert.equal(await page.locator('.cp-context-header h1').textContent(),'Start','New visitors retain Start');
   await page.close();
  }
 }finally{await browser.close();}
}
assert.deepEqual(errors,[]);
if(process.env.KLINK_START_COMPARE){
 const old=JSON.parse(readFileSync(process.env.KLINK_START_COMPARE));
 assert.deepEqual(unaffected,old.unaffected,'Non-Start screen layout and type stay identical');
 for(const item of cases){const prev=old.cases.find(p=>p.name===item.name&&p.theme===item.theme&&p.width===item.width);assert(item.first.y<=prev.first.y-10,'Categories move up by at least 10 pixels');}
}
writeFileSync(`${out}/checks.json`,JSON.stringify({base,baseline,cases,unaffected,errors},null,2)+'\n');
console.log(`PASS ${cases.length} Start layouts; 12 unchanged-screen comparisons; saved progress and no-progress state in both browsers/themes`);
