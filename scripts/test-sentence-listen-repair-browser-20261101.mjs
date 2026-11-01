import assert from 'node:assert/strict';
import{mkdirSync,writeFileSync}from'node:fs';
import{chromium,webkit}from'playwright';
const base=process.env.KLINK_TEST_URL||'http://127.0.0.1:18996';
const out=process.env.KLINK_REPAIR_OUTPUT||'outputs/sentence-listen-repair-20261101/local';mkdirSync(out,{recursive:true});
const sentence='#learner/chapters/sentences/sentences/groep-1.a1?level=a1&help=guided';
const dialogue='#learner/chapters/speaking/dialogues/klink-dialogue-32f962399de8f4c3?level=a2&help=practice';
const checks=[],errors=[];
async function prepare(p,blocked=true){
 p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(({blocked})=>{
  window.__repairAudio={ended:[],started:[],blocked:0};let unlocked=!blocked;
  for(const name of['pointerdown','keydown'])window.addEventListener(name,e=>{if(e.isTrusted)unlocked=true;},{capture:true});
  const play=HTMLMediaElement.prototype.play; // oxlint-disable-line typescript/unbound-method -- Deliberately wrap the native prototype, preserving its receiver with call.
  HTMLMediaElement.prototype.play=function(){if(!unlocked){window.__repairAudio.blocked++;return Promise.reject(new DOMException('First user interaction required','NotAllowedError'));}return play.call(this);};
  window.addEventListener('klink-audio-source',e=>{const a=e.detail;window.__repairCurrent=a;if(a.__repairObserved)return;a.__repairObserved=true;a.addEventListener('playing',()=>window.__repairAudio.started.push(a.src));a.addEventListener('ended',()=>window.__repairAudio.ended.push(a.src));});
  localStorage.setItem('klink.repair.preserved-progress','{"completed":["original"],"position":3}');
 },{blocked});
}
async function oldStorage(p){return p.evaluate(()=>Object.fromEntries(Object.keys(localStorage).filter(k=>k!=='klink.exercise-view.v1').sort().map(k=>[k,localStorage.getItem(k)])));}
async function views(p){
 const stage=p.locator('.cp-exercise-stage'),panel=p.locator('.cp-view-panel'),listen=p.locator('.cp-listen-slot button');
 const start=await panel.boundingBox(),id=await p.locator('[data-exercise-id]').getAttribute('data-exercise-id');
 for(const kind of['photo','text']){
  const button=panel.locator(`[data-view-toggle="${kind}"]`);const enabled=await button.isEnabled();
  const r=await button.boundingBox(),frame=await button.locator('span').boundingBox(),l=await listen.boundingBox();
  for(const box of[r,frame,l])assert.equal(Math.round(box.width),48);for(const box of[r,frame,l])assert.equal(Math.round(box.height),48);
  if(!enabled)continue;
  const before=await button.getAttribute('aria-pressed');await button.focus();await p.keyboard.press('Space');assert.notEqual(await button.getAttribute('aria-pressed'),before);
  await button.press('Enter');assert.equal(await button.getAttribute('aria-pressed'),before);
  await button.tap();const hidden=(await button.getAttribute('aria-pressed'))==='false';
  assert(await stage.locator(`[data-view-content="${kind}"]`).evaluateAll((els,hidden)=>els.every(e=>(getComputedStyle(e).visibility==='hidden')===hidden&&e.hasAttribute('inert')===hidden),hidden));
  await button.tap();assert.equal(await button.getAttribute('aria-pressed'),before);
 }
 const end=await panel.boundingBox();assert(Math.abs(end.x-start.x)<1&&Math.abs(end.y-start.y)<1,'Panel position retained');assert.equal(await p.locator('[data-exercise-id]').getAttribute('data-exercise-id'),id);
 assert.equal(await p.locator('[data-picture-settings]').count(),0);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
}
for(const[name,engine]of Object.entries({chromium,webkit})){
 const b=await engine.launch();
 try{for(const width of[1366,390,320])for(const theme of['light','dark']){
  const p=await b.newPage({viewport:{width,height:844},hasTouch:true,isMobile:width<600,colorScheme:theme});await prepare(p);
  await p.goto(base+'/'+sentence);await p.locator('.cp-listen-slot button').waitFor();await p.waitForFunction(()=>window.__repairAudio.blocked>0);
  await p.getByText('Tik op Luister',{exact:true}).waitFor();assert.equal(await p.locator('.cp-audio-retry').count(),0);assert(await p.locator('[data-practice-next]').isDisabled());
  assert.equal(await p.locator('[data-view-toggle="photo"]').isEnabled(),false);
  const stored=await oldStorage(p);await p.locator('.cp-listen-slot button').tap();await p.waitForFunction(()=>window.__repairCurrent&&!window.__repairCurrent.paused&&window.__repairCurrent.currentTime>0);
  await p.locator('[data-view-toggle="text"]').tap();assert(await p.evaluate(()=>!window.__repairCurrent.paused&&!window.__repairCurrent.error));
  await p.waitForFunction(()=>window.__repairAudio.ended.length>=1);assert(await p.locator('[data-practice-next]').isEnabled());assert.equal(await p.locator('.cp-audio-retry').count(),0);
  assert.equal(await p.locator('[data-view-toggle="text"]').getAttribute('aria-pressed'),'false');await p.locator('[data-view-toggle="text"]').tap();
  await views(p);assert.deepEqual(await oldStorage(p),stored);
  await p.locator('.cp-exercise-record-head h3').click();await p.keyboard.press('Space');await p.waitForFunction(()=>window.__repairAudio.ended.length>=2);assert.equal(await p.locator('.cp-audio-retry').count(),0);
  if(name==='chromium'&&theme==='light')await p.screenshot({path:`${out}/sentence-${width}.png`});
  checks.push({engine:name,width,theme,kind:'sentence',blockedAutoplayHandled:true,nativeFullPlayback:true,spaceReplay:true,miniPanelKeyboardAndTouch:true,oldStoragePreserved:true});
  await p.goto(base+'/'+dialogue);await p.locator('.cp-dialogue').waitFor();
  if(width<600){const head=await p.locator('.cp-context-header').boundingBox(),record=await p.locator('.cp-exercise-record-head').boundingBox();assert(record.y-head.y-head.height<2,'No empty mobile row');}
  await views(p);const tools=await p.locator('.cp-exercise-tools').boundingBox(),support=await p.locator('.cp-dialogue-support').boundingBox();assert(support.y-tools.y-tools.height<=12,'Compact conversation spacing');
  if(width===390&&theme==='light'){
   const storedDialogue=await oldStorage(p),ended=await p.evaluate(()=>window.__repairAudio.ended.length);await p.locator('.cp-listen-slot button').tap();await p.waitForFunction(()=>!window.__repairCurrent.paused&&window.__repairCurrent.currentTime>0);
   for(const kind of['photo','text'])await p.locator(`[data-view-toggle="${kind}"]`).tap();assert(await p.evaluate(()=>!window.__repairCurrent.paused&&!window.__repairCurrent.error));
   await p.waitForFunction(n=>window.__repairAudio.ended.length>=n+4,ended,{timeout:65000});assert(await p.locator('[data-practice-next]').isEnabled());
   for(const kind of['photo','text']){assert.equal(await p.locator(`[data-view-toggle="${kind}"]`).getAttribute('aria-pressed'),'false');await p.locator(`[data-view-toggle="${kind}"]`).tap();}
   assert.deepEqual(await oldStorage(p),storedDialogue);
  }
  if(name==='chromium'&&theme==='light')await p.screenshot({path:`${out}/dialogue-${width}.png`});
  checks.push({engine:name,width,theme,kind:'dialogue',equal48pxButtons:true,compact:true,miniPanelKeyboardAndTouch:true,nativeFourTurns:width===390&&theme==='light'});await p.close();
 }
 // A real failed recording must still offer retry and must not count as heard.
 const p=await b.newPage({viewport:{width:390,height:844}});await prepare(p,false);await p.route('**/package-audio/connected/4d1a9ce4d47897f166a2.mp3',route=>route.abort());
 await p.goto(base+'/'+sentence);await p.locator('.cp-audio-retry').waitFor();assert(await p.locator('[data-practice-next]').isDisabled());
 await p.unroute('**/package-audio/connected/4d1a9ce4d47897f166a2.mp3');await p.getByRole('button',{name:'Opnieuw luisteren',exact:true}).click();await p.waitForFunction(()=>window.__repairAudio.ended.length>0);assert.equal(await p.locator('.cp-audio-retry').count(),0);assert(await p.locator('[data-practice-next]').isEnabled());
 checks.push({engine:name,kind:'realNetworkFailure',retryWorks:true,falseCompletionPrevented:true});await p.close();
 }finally{await b.close();}
}
writeFileSync(out+'/checks.json',JSON.stringify({base,checks,errors},null,2)+'\n');assert.equal(checks.length,26);assert.deepEqual(errors,[]);console.log('PASS 26 native listening, browser-policy, retry, equal-size, mobile layout, mini-panel, keyboard and preserved-storage checks');
