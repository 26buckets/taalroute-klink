import assert from'node:assert/strict';
import{readFileSync,mkdirSync,writeFileSync}from'node:fs';
import{chromium,webkit}from'playwright';
import{chapterHash}from'../lib/practice-chapters.ts';
import{groupSessionKey}from'../lib/group-practice.ts';
import{collectionProgressId}from'../lib/round-progress.ts';
const folder='docs/handwriting-20261102/',base=process.env.KLINK_TEST_BASE||'http://127.0.0.1:19031',out=process.env.KLINK_TEST_OUTPUT||folder+'local';mkdirSync(out+'/screens',{recursive:true});
const manifest=JSON.parse(readFileSync(folder+'import-manifest.json')),checks=[],errors=[];
try{for(const[engine,type]of Object.entries({chromium,webkit})){
 const browser=await type.launch({headless:true,...(engine==='chromium'?{channel:'chrome'}:{})});
 try{for(const width of[1280,390,320])for(const theme of['light','dark'])for(const id of['KSW-AC-HS-080','KSW-AC-HS-098']){
  const row=manifest.newRows.find(x=>x.sourceIds.includes(id)).row,e=JSON.parse(readFileSync('public'+row.url)).exercises.find(x=>x.exerciseId===id),page=await browser.newPage({viewport:{width,height:width===320?568:844}});page.on('pageerror',error=>errors.push({engine,width,theme,id,message:error.message}));
  await page.goto(base);await page.evaluate(({theme,key,id})=>{window.TaalrouteAppearance.set(theme);localStorage.setItem(key,JSON.stringify({version:1,exerciseId:id,done:false}));},{theme,key:groupSessionKey('chapter:paper-dictation:'+row.id,'paper-dictation',collectionProgressId('paper-dictation',row.id,row.url)),id});await page.goto('about:blank');
  await page.goto(base+'/'+chapterHash({chapter:'writing',activity:'paper-dictation',collection:row.id,level:'alfa-c',help:'practice'}));const task=page.locator(`[data-handwriting-source="${id}"]`);await task.waitFor();await page.locator('[data-practice-listen]').click();await page.waitForFunction(id=>{const s=document.querySelector(`[data-handwriting-source="${id}"] svg.kpd-writing`);return s&&s.getAttribute('aria-disabled')!=='true';},id);
  const svg=task.locator('.kpd-writing');await svg.scrollIntoViewIfNeeded();const before=await svg.boundingBox();await page.mouse.move(before.x+before.width*.2,before.y+before.height*.25);await page.mouse.down();await page.mouse.move(before.x+before.width*.35,before.y+before.height*.7,{steps:8});await page.mouse.up();
  for(const state of['question','help','model']){
   if(state==='help')await page.getByRole('button',{name:'Help',exact:true}).click();
   if(state==='model'){await page.getByRole('button',{name:'Help',exact:true,expanded:true}).click();await task.getByRole('button',{name:'Vergelijk',exact:true}).click();await task.getByRole('button',{name:'Ik heb vergeleken',exact:true}).waitFor();}
   await task.locator('.cp-handwriting-input').evaluate(el=>el.scrollIntoView({block:'start',inline:'nearest'}));const geometry=await svg.evaluate(el=>{const b=el.getBoundingClientRect(),m=el.getScreenCTM(),tools=el.closest('.cp-exercise-stage').querySelector('.cp-exercise-tools');return{box:b.toJSON(),scaleX:m.a,scaleY:m.d,tools:tools?.getBoundingClientRect().toJSON(),viewport:innerWidth,scroll:document.documentElement.scrollWidth,points:el.querySelector('polyline')?.getAttribute('points')};});
   writeFileSync(out+'/last-layout-geometry.json',JSON.stringify({engine,width,theme,id,state,geometry},null,2)+'\n');
   assert(geometry.scroll<=geometry.viewport+1);assert(geometry.box.width<=width&&geometry.box.height>=90);assert(Math.abs(geometry.box.width/before.width-1)<.01&&Math.abs(geometry.box.height/before.height-1)<.01);assert(Math.abs(geometry.scaleX-geometry.scaleY)<.001);assert(geometry.points);
   if(geometry.tools){const a=geometry.box,b=geometry.tools,overlap=Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));assert(overlap<1,'The writing area must not lie under the existing listening/view controls');}
   if(state==='question')assert.equal(await task.locator('.cp-paper-model,.cp-word-hint strong').count(),0);else assert.equal(await page.locator(state==='help'?'.cp-word-hint strong':'.cp-paper-model').innerText(),e.target);
   await page.screenshot({path:`${out}/screens/${engine}-${width}-${theme}-${id}-${state}.png`,fullPage:true});checks.push({engine,width,theme,id,state,originalInkGeometryPreserved:true,uniformScale:true,noHorizontalOverflow:true,noListeningControlsOverWriting:true});
  }
  await page.close();
 }}finally{await browser.close();}
}}finally{writeFileSync(out+'/layout.json',JSON.stringify({base,checks,errors,physicalPhoneOrPenTested:false},null,2)+'\n');}
assert.equal(checks.length,72);assert.deepEqual(errors,[]);console.log('Passed72 long-model/hint layouts,original ink geometry and separate listening controls at1280/390/320,light/dark,Chromium/WebKit.');
