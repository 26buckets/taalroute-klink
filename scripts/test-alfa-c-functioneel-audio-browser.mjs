import { chromium, webkit } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const audio=JSON.parse(fs.readFileSync('data/klink-alfa-c-functioneel-audio.json'));
const base=process.env.KLINK_URL??'http://127.0.0.1:18868';
const out=process.env.KLINK_FUNCTIONEEL_OUTPUT??'outputs/alfa-c-functioneel';fs.mkdirSync(out,{recursive:true});
const checks=[];
for(const [name,engine] of Object.entries({chromium,webkit})) {
 const browser=await engine.launch();
 try{
  const page=await browser.newPage();await page.goto(base+'/#learner/alfa-c');
  for(const [i,clip] of audio.clips.entries()){
   const row=await page.evaluate(clip=>new Promise((resolve,reject)=>{
    const a=window.nativeTestAudio??=new Audio();a.src=clip.src;a.volume=0;
    const timer=setTimeout(()=>finish(Error('Audio timeout '+clip.src)),15000);
    const interval=setInterval(()=>{if(a.currentTime>0.03)finish();},20);
    const onError=()=>finish(Error('Decode failed '+clip.src));
    function finish(error){clearTimeout(timer);clearInterval(interval);a.removeEventListener('error',onError);const duration=a.duration;a.pause();a.removeAttribute('src');a.load();if(error)reject(error);else resolve({src:clip.src,duration,started:true});}
    a.addEventListener('error',onError,{once:true});a.play().catch(finish);
   }),clip);
   checks.push({engine:name,...row});if((i+1)%50===0)console.log(name+': '+(i+1)+' native files');
  }
  // Hear every dictation item through the real UI, without exposing its transcript.
  const blocks=JSON.parse(fs.readFileSync('data/klink-alfa-c-functioneel.json')).blocks;
  for(const b of blocks)for(const s of b.steps.filter(s=>s.kind==='dictation')){
   await page.evaluate(({id,n})=>localStorage.setItem('klink.alfa-c.functioneel.v1',JSON.stringify({version:1,positions:{[id]:n},records:{}})),{id:b.id,n:s.number-1});
   await page.goto(base+`/#learner/alfa-c/${b.id}`);await page.reload();await page.locator(`[data-functional-step="${s.id}"]`).waitFor();
   const ready=page.getByRole('button',{name:'Ik ben klaar',exact:true});assert(await ready.isDisabled());
   for(const [n,text]of s.dictationTexts.entries()){
    assert(!(await page.locator('.functional-player').innerText()).includes(text));
    const label=s.dictationTexts.length>1?`Luister ${n+1}`:(s.id.endsWith('formulier-08')?'Luister naar het nummer':'Luister naar de zin');
    await page.getByRole('button',{name:label,exact:true}).click();
    await page.waitForFunction(()=>!document.querySelector('.functional-player .pilot-tools button')?.disabled,{},{timeout:15000});
   }
   assert(await ready.isEnabled());
  }
 }finally{await browser.close();}
}
assert.equal(checks.length,audio.clips.length*2);fs.writeFileSync(`${out}/native-audio-report.json`,JSON.stringify({checks,dictationUIs:8},null,2));console.log(JSON.stringify({nativePlaybacks:checks.length,dictationUIs:8}));
