import assert from 'node:assert/strict';
import {readFileSync as read,writeFileSync as write} from 'node:fs';
import {chromium,webkit} from 'playwright';
const base=process.env.KLINK_TEST_URL||'http://127.0.0.1:18950';
const output=process.env.KLINK_RECORDER_OUTPUT||'docs/klink10-speaking-20261102/local/recorder.json';
const rows=[JSON.parse(read('docs/klink10-speaking-20261102/manifest.json')).row];
const checks=[],errors=[];
const path=r=>base+'/#learner/chapters/speaking/sentence-speak/'+r.id+'?level='+r.level+'&help=guided';
async function listen(page,row){
 const e=JSON.parse(read('public'+row.url)).exercises[0];
 await page.getByRole('button',{name:'Luister naar '+e.displayWord,exact:true}).first().click();
 await page.waitForFunction(()=>window.__modelAudio?.some(a=>!a.paused&&Number.isFinite(a.duration)));
 await page.waitForFunction(src=>window.__modelAudio?.some(a=>a.currentSrc.endsWith(src)&&a.ended),e.prompt.audio.src);
 await page.getByText('Aan de slag',{exact:true}).waitFor();
}
const trackModels=()=>{window.__modelAudio=[];window.addEventListener('klink-audio-source',e=>window.__modelAudio.push(e.detail));};
const browser=await chromium.launch({channel:'chrome',args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']});
try{
 const page=await browser.newPage({permissions:['microphone'],viewport:{width:1366,height:900}});
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(trackModels);
 await page.addInitScript(()=>{
  window.__recordStreams=[];window.__revoked=[];
  const get=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
  navigator.mediaDevices.getUserMedia=async constraints=>{const s=await get(constraints);window.__recordStreams.push(s);return s;};
  const revoke=URL.revokeObjectURL.bind(URL);URL.revokeObjectURL=url=>{window.__revoked.push(url);revoke(url);};
 });
 for(const level of ['alfa-a']){
  const row=rows.find(r=>r.level===level);assert(row,level);
  await page.goto(path(row));await page.locator('.cp-recorder').waitFor({timeout:60000});
  await listen(page,row);
  for(let take=0;take<2;take++){
   const recording=page.getByLabel('Jouw opname',{exact:true});
   const previous=await recording.count()?await recording.getAttribute('src'):null;
   await page.getByRole('button',{name:'Neem op',exact:true}).click();
   await page.getByRole('button',{name:'Stop',exact:true}).waitFor();
   assert(await page.getByRole('button',{name:'Klaar',exact:true}).isDisabled());
   await page.waitForTimeout(650);
   await page.getByRole('button',{name:'Stop',exact:true}).click();
   const audio=page.getByLabel('Jouw opname',{exact:true});await audio.waitFor();
   await page.waitForFunction(previous=>{const a=document.querySelector('audio[aria-label="Jouw opname"]');return a?.readyState>=1&&a.src!==previous&&a.currentSrc===a.src;},previous);
   assert((await audio.getAttribute('src')).startsWith('blob:'));
   await audio.evaluate(a=>a.play());
   await page.waitForFunction(()=>!document.querySelector('audio[aria-label="Jouw opname"]').paused);
   assert(await page.getByRole('button',{name:'Klaar',exact:true}).isDisabled());
   await page.waitForFunction(()=>document.querySelector('audio[aria-label="Jouw opname"]').ended);
   await page.waitForFunction(()=>window.__recordStreams.every(s=>s.getTracks().every(t=>t.readyState==='ended')));
   assert(!(await page.getByRole('button',{name:'Klaar',exact:true}).isDisabled()));
   assert(!(await page.evaluate(()=>JSON.stringify(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)])))).includes('blob:'));
   checks.push({level,take,realMediaRecorder:true,nativePlayback:true,busyControls:true,tracksStopped:true,recordingStoredOnlyInMemory:true});
  }
  assert(await page.evaluate(()=>window.__revoked.length>0));
  await page.getByRole('button',{name:'Klaar',exact:true}).click();
  await page.locator('.cp-exercise-feedback.right').waitFor();
  assert((await page.locator('.cp-exercise-feedback').innerText()).includes('Luister zelf of samen met je docent'));
 }
 const row=rows.find(r=>r.level==='alfa-a');await page.goto(path(row));
 // Resume the next untouched question to test unmount cleanup.
 await page.goto(path(rows.find(r=>r.level==='alfa-a')));
 await page.getByRole('button',{name:'Neem op',exact:true}).click();await page.getByRole('button',{name:'Stop',exact:true}).waitFor();
 await page.evaluate(()=>{location.hash='#learner/home';});await page.locator('.cp-home').waitFor();
 await page.waitForFunction(()=>window.__recordStreams.every(s=>s.getTracks().every(t=>t.readyState==='ended')));
 checks.push({unmountStopsMicrophone:true});
}finally{await browser.close();}
for(const engine of [chromium,webkit]){
 const b=await engine.launch();try{
  const page=await b.newPage({viewport:{width:390,height:844},colorScheme:'dark'});page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(trackModels);
  await page.addInitScript(()=>{Object.defineProperty(navigator,'mediaDevices',{value:{getUserMedia:async()=>{throw new DOMException('Denied','NotAllowedError');}},configurable:true});});
  const row=rows.find(r=>r.level==='alfa-a');await page.goto(path(row));await page.locator('.cp-recorder').waitFor({timeout:60000});await listen(page,row);
  await page.getByRole('button',{name:'Neem op',exact:true}).click();await page.getByText('De microfoon werkt niet. Zeg je antwoord hardop. Tik daarna op Klaar.',{exact:true}).waitFor();
  assert(!(await page.getByRole('button',{name:'Klaar',exact:true}).isDisabled()));
  await page.getByRole('button',{name:'Klaar',exact:true}).click();await page.locator('.cp-exercise-feedback.right').waitFor();assert((await page.locator('.cp-exercise-feedback').innerText()).includes('Luister zelf of samen met je docent'));
  checks.push({engine:engine.name(),deniedMicrophoneFallback:true,participationOnly:true});
 }finally{await b.close();}
}
write(output,JSON.stringify({base,checks,errors,physicalMicrophoneTest:false},null,2)+'\n');assert.deepEqual(errors,[]);console.log(JSON.stringify({checks:checks.length,errors:errors.length}));
