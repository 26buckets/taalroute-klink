import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
import {classroomLessons,freshClassroom,phasesForRoute,routeIds,classroomKey} from '../lib/teacher-classroom.ts';
const base=process.env.KLINK_URL||'http://127.0.0.1:18996',out=process.env.KLINK_LABEL_OUTPUT||'outputs/teacher-phase-labels-20261101/local';mkdirSync(out,{recursive:true});
const checks=[],errors=[],lessons=['mat','tas','sok','meer'];
const geometry=p=>p.locator('.kpd-phases button').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return{width:r.width,height:r.height,x:r.x,y:r.y,font:s.font,fontSize:s.fontSize,color:s.color,background:s.backgroundColor};}));
async function open(browser,url,lesson,route,width){
 const state={...freshClassroom('basic',route,lesson),active:true,ownSentence:'Mijn bewaarde zin.'};
 const p=await browser.newPage({viewport:{width,height:width===320?568:844},hasTouch:true,isMobile:width<600});
 p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(({state,key})=>{if(!sessionStorage.getItem(key)){sessionStorage.setItem(key,JSON.stringify(state));sessionStorage.setItem(key+'.'+state.lessonId,JSON.stringify(state));localStorage.setItem('klink.phase-label-preservation-probe','niet veranderen');}},{state,key:classroomKey});
 await p.goto(url+'/#teacher/plus');await p.locator('.kpd-live').waitFor();
 await p.getByRole('button',{name:'Kies onderdeel',exact:true}).click();return p;
}
for(const[engine,type]of Object.entries({chromium,webkit})){
 const browser=await type.launch();
 try{for(const width of[1366,390,320])for(const lesson of lessons)for(const route of routeIds){
  const p=await open(browser,base,lesson,route,width),buttons=p.locator('.kpd-phases button');
  assert.equal(await p.locator('.kpd-lesson-choice').count(),0);assert.equal(classroomLessons.length,58);
  const expected=phasesForRoute(route,lesson).map((phase,i)=>(i+1)+' '+phase.title);
  assert.deepEqual((await buttons.allTextContents()).map(s=>s.replace(/\s+/g,' ').trim().replace(/^(\d+)\s*/,'$1 ')),expected);
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  const g=await geometry(p);assert(g.every(b=>b.width>=48&&b.height>=48));
  if(lesson==='sok'&&route==='a'){
   const old=await open(browser,'https://klink.taalroute.nl',lesson,route,width),before=await geometry(old);
   for(let i=0;i<g.length;i++){for(const key of ['width','x','font','fontSize','color','background'])assert.equal(g[i][key],before[i][key],'The approved columns and button style stay identical');assert(g[i].height<=before[i].height,'Shorter labels may wrap less');}await old.close();
   await p.screenshot({path:out+'/'+engine+'-'+width+'-choices.png',fullPage:true});
  }
  await buttons.nth(4).focus();await p.keyboard.press('Enter');assert.equal(await p.locator('.kpd-phases').isVisible(),false);
  assert.equal(await p.locator('.kpd-position').innerText(),phasesForRoute(route,lesson)[4].title+'\n5 van 8');
  await p.reload();await p.locator('.kpd-live').waitFor();
  const saved=await p.evaluate(key=>JSON.parse(sessionStorage.getItem(key)),classroomKey);
  assert.equal(saved.phase,4);assert.equal(saved.lessonId,lesson);assert.equal(saved.route,route);assert.equal(saved.ownSentence,'Mijn bewaarde zin.');
  assert.equal(await p.evaluate(()=>localStorage.getItem('klink.phase-label-preservation-probe')),'niet veranderen');
  await p.getByRole('button',{name:'Kies onderdeel',exact:true}).tap();await p.locator('.kpd-phases button').nth(0).tap();assert.equal(await p.locator('.kpd-phases').isVisible(),false);
  checks.push({engine,width,lesson,route,labels:expected,stylesAndGridPreserved:lesson==='sok'&&route==='a',touch:true,keyboard:true,reload:true,answersPreserved:true});await p.close();
 }console.log(engine,'36 phase menu cases PASS');}finally{await browser.close();}
}
assert.deepEqual(errors,[]);assert.equal(checks.length,72);writeFileSync(out+'/checks.json',JSON.stringify({base,checks,errors},null,2)+'\n');console.log('PASS 72 desktop/mobile phase menu, keyboard, touch and preserved answer checks');
