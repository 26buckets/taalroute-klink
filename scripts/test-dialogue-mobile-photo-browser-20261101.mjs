import assert from 'node:assert/strict';
import{readFileSync,writeFileSync,mkdirSync,existsSync}from'node:fs';
import{chromium,webkit}from'playwright';
const base=process.env.KLINK_TEST_URL||'http://127.0.0.1:18996';
const out=process.env.KLINK_PHOTO_OUTPUT||'outputs/dialogue-mobile-photo-20261101/local',references='outputs/dialogue-mobile-photo-20261101/references';mkdirSync(out,{recursive:true});mkdirSync(references,{recursive:true});
const dialogues=JSON.parse(readFileSync('data/klink-dialogue-repair.json')).dialogues,pilot=dialogues.find(d=>d.id==='klink-dialogue-32f962399de8f4c3');
const reps=[...new Map(dialogues.map(d=>[d.image.src,d])).values()];
for(const d of [...dialogues].sort((a,b)=>Math.max(...b.turns.map(t=>t.speaker.length))-Math.max(...a.turns.map(t=>t.speaker.length))).slice(0,1))if(!reps.includes(d))reps.push(d);
const route=d=>'#learner/chapters/speaking/dialogues/'+d.id+'?level=a2&help=practice',checks=[],native=[],errors=[];
const storage=p=>p.evaluate(()=>Object.fromEntries(Object.keys(localStorage).filter(k=>k!=='klink.exercise-view.v1').sort().map(k=>[k,localStorage.getItem(k)])));
async function open(p,d){await p.goto(base+'/'+route(d));await p.locator('.cp-dialogue-scene > img').waitFor();await p.waitForFunction(()=>{const i=document.querySelector('.cp-dialogue-scene > img');return i?.complete&&i.naturalWidth>0;});}
async function geometry(p,mobile){return p.locator('.cp-dialogue-scene').evaluate((el,mobile)=>{const img=el.querySelector('img'),text=el.querySelector('p'),name=el.querySelector('h3'),a=img.getBoundingClientRect(),t=text.getBoundingClientRect(),range=document.createRange();range.selectNodeContents(name);const names=[...range.getClientRects()];return{photo:[a.width,a.height],ratioPreserved:Math.abs(a.height-a.width*img.naturalHeight/img.naturalWidth)<1,fit:getComputedStyle(img).objectFit,textSize:getComputedStyle(text).fontSize,photoAboveText:!mobile||a.bottom<=t.top+1,nameClear:!mobile||names.every(r=>r.right<=a.left-6||r.top>=a.bottom),horizontalOverflow:document.documentElement.scrollWidth>innerWidth+1};},mobile);}
for(const[engineName,engine]of Object.entries({chromium,webkit})){
 const browser=await engine.launch();
 try{
 for(const[width,height,theme]of[[320,844,'light'],[375,812,'light'],[390,844,'light'],[390,844,'dark'],[760,900,'light'],[761,900,'light'],[1366,900,'light'],[320,568,'light']]){
  const p=await browser.newPage({viewport:{width,height},hasTouch:true,isMobile:width<600,colorScheme:theme});p.on('pageerror',e=>errors.push(e.message));await open(p,pilot);const mobile=width<=760,g=await geometry(p,mobile);assert.equal(g.horizontalOverflow,false);assert.equal(g.fit,'contain');assert(g.nameClear&&g.photoAboveText&&g.ratioPreserved);assert(parseFloat(g.textSize)>=24);
  if(mobile){assert(g.photo[0]<=96&&g.photo[1]<=64);if(height>=812)assert(await p.locator('.cp-dialogue-controls').evaluate(e=>e.getBoundingClientRect().bottom<=e.closest('.cp-exercise-stage').getBoundingClientRect().bottom+1),'All playback controls visible');}
  else{
   assert(g.photo[0]>96);const ref=references+'/'+engineName+'-'+width+'.png';
   if(!existsSync(ref)){const old=await browser.newPage({viewport:{width,height},colorScheme:theme});await old.goto('https://klink.taalroute.nl/'+route(pilot));await old.locator('.cp-dialogue-scene > img').waitFor();await old.waitForFunction(()=>document.querySelector('.cp-dialogue-scene > img')?.complete);await old.locator('.cp-exercise-stage').screenshot({path:ref,animations:'disabled'});await old.close();}
   assert((await p.locator('.cp-exercise-stage').screenshot({animations:'disabled'})).equals(readFileSync(ref)),'Desktop stage is pixel-identical to the approved live version');
  }
  const old=await storage(p);const panel=p.locator('.cp-view-panel'),position=await panel.boundingBox();
  for(const kind of['photo','text']){const b=p.locator(`[data-view-toggle="${kind}"]`);await b.focus();await p.keyboard.press('Space');assert.equal(await b.getAttribute('aria-pressed'),'false');assert(await p.locator(`[data-view-content="${kind}"]`).first().evaluate(e=>getComputedStyle(e).visibility==='hidden'&&e.hasAttribute('inert')));await b.press('Enter');assert.equal(await b.getAttribute('aria-pressed'),'true');}
  assert.deepEqual(await storage(p),old);const after=await panel.boundingBox();assert(Math.abs(after.x-position.x)<1&&Math.abs(after.y-position.y)<1);
  const pause=p.getByRole('button',{name:'Pauze',exact:true});await pause.scrollIntoViewIfNeeded();assert(await pause.isVisible());assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await p.locator('.cp-exercise-stage').evaluate(e=>{e.scrollTop=0;});
  if(engineName==='chromium'&&theme==='light'&&[320,375,390,1366].includes(width)&&height>=812)await p.screenshot({path:out+'/mobile-photo-'+width+'.png'});
  checks.push({engine:engineName,width,height,theme,...g,miniPanelKeyboard:true,storagePreserved:true,desktopPixelIdentical:!mobile});await p.close();
 }
 const p=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});p.on('pageerror',e=>errors.push(e.message));
 for(const d of reps){await open(p,d);for(let turn=0;turn<d.turns.length;turn++){const g=await geometry(p,true);assert(g.nameClear&&g.photoAboveText&&g.ratioPreserved&&!g.horizontalOverflow,d.id+'/'+turn);assert(g.photo[0]<=96&&g.photo[1]<=64);if(turn<d.turns.length-1)await p.getByRole('button',{name:'Volgende spreekbeurt',exact:true}).click();}checks.push({engine:engineName,kind:'imageAndAllTurns',id:d.id,photo:d.image.src,turns:d.turns.length,completeImage:true,nameClear:true,textSizeUnchanged:true});}
 await p.close();
 const sound=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});sound.on('pageerror',e=>errors.push(e.message));
 await sound.addInitScript(()=>{window.__photoEnded=[];window.addEventListener('klink-audio-source',e=>{window.__photoAudio=e.detail;const a=e.detail;if(a.__photoObserved)return;a.__photoObserved=true;a.addEventListener('ended',()=>window.__photoEnded.push(new URL(a.src).pathname));});});
 await open(sound,pilot);const before=await storage(sound);await sound.locator('.cp-listen-slot button').tap();await sound.waitForFunction(()=>window.__photoAudio.currentTime>0&&!window.__photoAudio.paused);
 for(const kind of['photo','text'])await sound.locator(`[data-view-toggle="${kind}"]`).tap();assert(await sound.evaluate(()=>!window.__photoAudio.paused&&!window.__photoAudio.error));
 await sound.waitForFunction(()=>window.__photoEnded.length===4,undefined,{timeout:65000});assert.deepEqual(await sound.evaluate(()=>window.__photoEnded),pilot.turns.map(t=>t.src));assert(await sound.locator('[data-practice-next]').isEnabled());assert.deepEqual(await storage(sound),before);
 for(const kind of['photo','text']){assert.equal(await sound.locator(`[data-view-toggle="${kind}"]`).getAttribute('aria-pressed'),'false');await sound.locator(`[data-view-toggle="${kind}"]`).tap();}
 await sound.locator('.cp-exercise-record-head h3').click();await sound.keyboard.press('Space');await sound.waitForFunction(()=>window.__photoAudio.currentTime>0&&!window.__photoAudio.paused);await sound.getByRole('button',{name:'Pauze',exact:true}).tap();assert(await sound.evaluate(()=>window.__photoAudio.paused));assert.deepEqual(await storage(sound),before);
 native.push({engine:engineName,nativeOriginalFourTurns:true,unmuted:true,noAcceleration:true,miniPanelTouchDuringPlayback:true,spaceReplay:true,pause:true,progressPreserved:true});await sound.close();
 }finally{await browser.close();}
}
writeFileSync(out+'/checks.json',JSON.stringify({base,dialogues:dialogues.length,images:new Set(dialogues.map(d=>d.image.src)).size,checks,native,errors},null,2)+'\n');assert.equal(native.length,2);assert.deepEqual(errors,[]);console.log('PASS '+checks.length+' mobile photo/layout/desktop/turn checks and two complete native audio/keyboard/touch/progress checks');
