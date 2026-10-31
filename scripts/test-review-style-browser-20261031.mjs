import assert from 'node:assert/strict';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
import {allPackageWords,contentPackages} from '../lib/package-content.ts';
import {chapterCollections} from '../lib/practice-chapters.ts';
import {learningReviewKey} from '../lib/learning-review.ts';
import {progressKey} from '../lib/learner-progress.ts';
const base=process.env.KLINK_TEST_URL||'http://127.0.0.1:18986';
const out=process.env.KLINK_TEST_OUTPUT||'outputs/review-style-20261031/layout';
const baseline=process.env.KLINK_REVIEW_STYLE_BASELINE==='1';
mkdirSync(out,{recursive:true});
const savedKey='klink.taalroute.savedWords.v1';
const lesson=contentPackages.flatMap(p=>p.lessons).find(l=>l.newWords?.length>=2);
const exercise=chapterCollections('learning-review').flatMap(c=>c.exercises).find(e=>e.exerciseId.includes(':recall:'));
const savedWords=allPackageWords.filter(w=>w.audio).slice(0,2);
const cases=[],unaffected=[],errors=[];
for(const[name,engine]of Object.entries({chromium,webkit})){
 const browser=await engine.launch();
 try{
  for(const theme of ['light','dark']){
   const page=await browser.newPage({colorScheme:theme});
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base+'/#learner/review');await page.locator('.review-page').waitFor();
   for(const[width,height]of [[1366,900],[390,844],[320,568]]){
    await page.setViewportSize({width,height});
    for(const stateName of ['due','mix','saved','empty']){
     const due=stateName==='due'||stateName==='mix';
     const state={
      [savedKey]:JSON.stringify(stateName==='saved'?savedWords.map(w=>w.id):[]),
      [progressKey]:JSON.stringify({completed:stateName==='mix'?[lesson.id]:[]}),
      [learningReviewKey]:JSON.stringify(due?{[exercise.exerciseId]:{due:0,last:1,streak:0}}:{}),
      'klink.taalroute.attempts.v1':JSON.stringify([{exerciseId:exercise.exerciseId,correct:false,at:'2026-10-31T08:00:00.000Z'}])
     };
     await page.evaluate(state=>{for(const[k,v]of Object.entries(state))localStorage.setItem(k,v);},state);
     await page.reload();await page.locator('.review-page').waitFor();await page.evaluate(()=>document.fonts.ready);
     const geometry=await page.locator('.review-page').evaluate(root=>{
      const bounds=el=>{if(!el)return null;const r=el.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom};};
      const actions=[...root.querySelectorAll('.cp-review-mixed :is(a,button)')];
      const empty=root.querySelector('.honest-empty');
      return{copy:bounds(root.querySelector('.cp-review-copy')),actions:actions.map(bounds),empty:bounds(empty),choose:bounds(root.querySelector('.honest-empty button')),stripe:empty?getComputedStyle(empty).borderTopWidth:null,separator:root.querySelector('.cp-review-tools')?getComputedStyle(root.querySelector('.cp-review-tools')).borderBottomWidth:null,overflow:document.documentElement.scrollWidth>innerWidth+1,clipped:actions.some(b=>b.scrollWidth>b.clientWidth+1),instruction:[...root.querySelectorAll('p')].some(p=>p.textContent==='Tik en luister.')};
     });
     assert.equal(geometry.overflow,false);assert.equal(geometry.clipped,false);
     assert.equal(await page.getByRole('link',{name:'Oefen opnieuw',exact:true}).count(),Number(due));
     assert.equal(await page.getByRole('button',{name:'Woordenmix',exact:true}).count(),Number(stateName==='mix'||stateName==='saved'));
     assert.equal(await page.locator('.review-word-list > div > button').count(),stateName==='saved'?2:0);
     if(!baseline){
      assert.equal(await page.locator('.cp-review-tools').count(),Number(due||stateName==='mix'||stateName==='saved'));
      assert.equal(geometry.instruction,stateName==='saved');
      assert(geometry.actions.every(b=>b.height>=48&&b.width>=44));
      if(geometry.empty){assert.equal(geometry.stripe,'0px');assert(Math.abs(geometry.choose.x+geometry.choose.width/2-geometry.empty.x-geometry.empty.width/2)<2);}
      if(due){assert.equal(geometry.separator,'1px');if(width<650)assert(geometry.actions[0].y>=geometry.copy.bottom);else assert(Math.abs(geometry.actions[0].y+geometry.actions[0].height/2-geometry.copy.y-geometry.copy.height/2)<2);}
     }
     assert.deepEqual(await page.evaluate(keys=>Object.fromEntries(keys.map(k=>[k,localStorage.getItem(k)])),Object.keys(state)),state,'Rendering preserves all storage byte for byte');
     if(stateName==='due')await page.screenshot({path:`${out}/${name}-${theme}-${width}.png`});
     cases.push({name,theme,width,stateName,...geometry});
    }
   }
   await page.setViewportSize({width:390,height:844});
   for(const route of ['#learner/home','#learner/words','#learner/chapters/words?level=alfa-a&help=practice']){
    await page.goto(base+'/'+route);
    const selector=route==='#learner/home'?'.cp-home':route==='#learner/words'?'.word-library-page':'.cp-chapters';
    await page.locator(selector).waitFor();await page.evaluate(()=>document.fonts.ready);
    const data=await page.locator(selector).evaluate(root=>[...root.querySelectorAll('h1,.cp-direct-actions button,.cp-direct-levels button,[data-chapter],.cp-activity-button')].map(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return{text:el.textContent,x:r.x,y:r.y,width:r.width,height:r.height,font:s.font,color:s.color,background:s.backgroundColor};}));
    unaffected.push({name,theme,route,data});
   }
   await page.close();
  }
 }finally{await browser.close();}
}
assert.deepEqual(errors,[]);
if(process.env.KLINK_REVIEW_STYLE_COMPARE)assert.deepEqual(unaffected,JSON.parse(readFileSync(process.env.KLINK_REVIEW_STYLE_COMPARE)).unaffected,'Start, words and chapter screens remain identical');
writeFileSync(`${out}/checks.json`,JSON.stringify({base,baseline,cases,unaffected,errors},null,2)+'\n');
console.log(`PASS ${cases.length} review states and 12 other-screen comparisons in both browsers/themes; original availability and storage preserved`);
