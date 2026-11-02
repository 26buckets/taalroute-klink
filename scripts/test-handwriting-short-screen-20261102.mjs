import assert from'node:assert/strict';
import{readFileSync,mkdirSync,writeFileSync}from'node:fs';
import{chromium,webkit}from'playwright';
import{chapterHash}from'../lib/practice-chapters.ts';
import{groupSessionKey}from'../lib/group-practice.ts';
import{collectionProgressId}from'../lib/round-progress.ts';
const root='docs/handwriting-20261102/',base=process.env.KLINK_TEST_BASE||'http://127.0.0.1:19031',out=process.env.KLINK_TEST_OUTPUT||root+'short-screen/local';mkdirSync(out+'/screens',{recursive:true});const manifest=JSON.parse(readFileSync(root+'import-manifest.json')),checks=[],errors=[];
async function reach(page,svg){
 await page.locator('.cp-exercise-stage').evaluate(el=>el.scrollIntoView({block:'center'}));
 for(let i=0;i<3;i++){
  const g=await svg.evaluate(el=>({ink:el.getBoundingClientRect().toJSON(),stage:el.closest('.cp-exercise-stage').getBoundingClientRect().toJSON(),tools:el.closest('.cp-exercise-stage').querySelector('.cp-exercise-tools').getBoundingClientRect().toJSON()}));
  await page.mouse.move(g.stage.x+g.stage.width*.6,g.stage.y+g.stage.height*.6);await page.mouse.wheel(0,g.ink.top-g.tools.bottom-4);await page.waitForTimeout(100);
 }
 const g=await svg.evaluate(el=>{const b=el.getBoundingClientRect(),stage=el.closest('.cp-exercise-stage').getBoundingClientRect(),tools=el.closest('.cp-exercise-stage').querySelector('.cp-exercise-tools').getBoundingClientRect();return{ink:b.toJSON(),stage:stage.toJSON(),tools:tools.toJSON(),corners:[[b.x+4,b.y+4],[b.right-4,b.y+4],[b.x+4,b.bottom-4],[b.right-4,b.bottom-4]].map(([x,y])=>document.elementFromPoint(x,y)?.closest('svg')===el),matrix:[el.getScreenCTM().a,el.getScreenCTM().d],points:el.querySelector('polyline')?.getAttribute('points')};});
 assert(g.ink.height>=90);assert(g.ink.top>=g.tools.bottom+1);assert(g.ink.bottom<=g.stage.bottom-1);assert(g.corners.every(Boolean),'All four ink corners must accept real pointer input,clear of toolbar,clipping and footer');assert(Math.abs(g.matrix[0]-g.matrix[1])<.001);return g;
}
try{for(const[engine,type]of Object.entries({chromium,webkit})){
 const browser=await type.launch({headless:true,...(engine==='chromium'?{channel:'chrome'}:{})});try{for(const theme of['light','dark'])for(const id of['KSW-AC-HS-080','KSW-AC-HS-098']){
  const row=manifest.newRows.find(x=>x.sourceIds.includes(id)).row,page=await browser.newPage({viewport:{width:320,height:568}});page.on('pageerror',e=>errors.push({engine,theme,id,message:e.message}));await page.goto(base);await page.evaluate(({theme,key,id})=>{window.TaalrouteAppearance.set(theme);localStorage.setItem(key,JSON.stringify({version:1,exerciseId:id,done:false}));},{theme,id,key:groupSessionKey('chapter:paper-dictation:'+row.id,'paper-dictation',collectionProgressId('paper-dictation',row.id,row.url))});await page.goto(base+'/'+chapterHash({chapter:'writing',activity:'paper-dictation',collection:row.id,level:'alfa-c',help:'practice'}));const task=page.locator(`[data-handwriting-source="${id}"]`),svg=task.locator('svg.kpd-writing');await task.waitFor();await page.locator('[data-practice-listen]').click();await page.waitForFunction(()=>document.querySelector('svg.kpd-writing')?.getAttribute('aria-disabled')!=='true');const before=await reach(page,svg),b=before.ink;await page.mouse.move(b.x+b.width*.15,b.y+b.height*.2);await page.mouse.down();await page.mouse.move(b.x+b.width*.8,b.y+b.height*.8,{steps:6});await page.mouse.up();const points=await svg.locator('polyline').getAttribute('points');
  for(const state of['question','model']){
   if(state==='model'){await task.getByRole('button',{name:'Vergelijk',exact:true}).click();await task.getByRole('button',{name:'Ik heb vergeleken',exact:true}).waitFor();}
   const geometry=await reach(page,svg);assert.equal(geometry.points,points);assert(Math.abs(geometry.ink.width-before.ink.width)<1&&Math.abs(geometry.ink.height-before.ink.height)<1);await page.screenshot({path:`${out}/screens/${engine}-${theme}-${id}-${state}.png`});checks.push({engine,theme,id,state,width:320,height:568,geometry,allFourCornersReachableByActualMouseWheel:true,uniformScaleAndOriginalInkPreserved:true});
  }await page.close();
 }}finally{await browser.close();}
}}finally{writeFileSync(out+'/short-screen.json',JSON.stringify({base,checks,errors,physicalPhoneOrPenTested:false},null,2)+'\n');}assert.equal(checks.length,16);assert.deepEqual(errors,[]);console.log('Passed16 short-screen states:all four ink corners accept pointer input after real scrolling,clear of toolbar/clipping/footer; geometry and original strokes preserved.');
