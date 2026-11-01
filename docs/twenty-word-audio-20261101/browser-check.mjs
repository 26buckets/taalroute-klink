import {chromium,webkit} from '/Users/nicoknoester/.cache/klink-twenty-word-release-20261101/node_modules/playwright/index.mjs';
import sharp from '/Users/nicoknoester/.cache/klink-twenty-word-release-20261101/node_modules/sharp/lib/index.js';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {chapterCollections,chapterHash} from '/Users/nicoknoester/.cache/klink-twenty-word-release-20261101/lib/practice-chapters.ts';
import {wordAudioIndex} from '/Users/nicoknoester/.cache/klink-twenty-word-release-20261101/lib/word-audio.ts';
const repo='/Users/nicoknoester/.cache/klink-twenty-word-release-20261101';
const base=process.env.KLINK_TEST_URL||'http://127.0.0.1:29910',reference=process.env.KLINK_REFERENCE_URL;
const out=new URL(process.env.KLINK_LIVE==='1'?'./live/':'./browser/',import.meta.url);mkdirSync(out,{recursive:true});
const clips=JSON.parse(readFileSync(repo+'/data/klink-word-audio-twenty-reviewed-20261101.json')).clips;
const route='/#learner/chapters/grammar/content-grammatica/content%3Agrammatica%3Aklink-local-grammar-g62-20261018%3Ab1%3Agrammar?level=b1&help=guided';
const results=process.env.KLINK_ENGINE==='webkit'?JSON.parse(readFileSync(new URL('./chromium-passed.json',import.meta.url))):[],errors=[];
async function setup(page,theme){
 page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(25000);
 await page.addInitScript(theme=>{localStorage.setItem('taalroute-klink-appearance-v1',theme);localStorage.setItem('twenty-audio-preserve','saved');window.__audio=[];window.addEventListener('klink-audio-source',e=>{const a=e.detail;a.muted=true;const row={src:a.src,playing:false,ended:false};window.__audio.push(row);a.addEventListener('playing',()=>{row.playing=true;row.duration=a.duration});a.addEventListener('ended',()=>row.ended=true);});},theme);
}
async function openExample(page,url){await page.goto(url+route);await page.getByRole('button',{name:'Begin samen',exact:true}).click();await page.waitForFunction(()=>!document.querySelector('.cp-opening-loader'));await page.locator('.cp-instruction-example').waitFor();await page.evaluate(()=>document.fonts.ready);await page.mouse.move(0,0);await page.evaluate(()=>Promise.all(document.getAnimations().filter(a=>a.effect?.getComputedTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{}))));}
async function clickWord(page,word,src){const i=await page.evaluate(()=>window.__audio.length);await page.locator(`[data-word-audio="${word}"]`).first().click();await page.waitForFunction(i=>window.__audio[i]?.ended,i);const r=await page.evaluate(i=>window.__audio[i],i);assert(r.playing&&r.ended&&r.duration>0);assert.equal(new URL(r.src).pathname,src);return r;}
for(const[name,engine]of Object.entries({chromium,webkit})){
 if(process.env.KLINK_ENGINE&&name!==process.env.KLINK_ENGINE)continue;
 const browser=await engine.launch();try{
  for(const width of [390,1366])for(const theme of ['light','dark']){
   const p=await browser.newPage({viewport:{width,height:950},colorScheme:theme});await setup(p,theme);await openExample(p,base);assert.equal(await p.locator('html').getAttribute('data-theme'),theme);
   const before=await p.locator('.cp-instruction-example').screenshot({animations:'disabled',path:new URL(`${name}-${width}-${theme}.png`,out).pathname});
   let pixelEqual,wordEdgePixels=0;
   if(reference){const ref=await browser.newPage({viewport:{width,height:950},colorScheme:theme});await setup(ref,theme);await openExample(ref,reference);assert.equal(await ref.locator('html').getAttribute('data-theme'),theme);const old=await ref.locator('.cp-instruction-example').screenshot({animations:'disabled',path:new URL(`${name}-${width}-${theme}-reference.png`,out).pathname});const a=await sharp(before).raw().toBuffer({resolveWithObject:true}),b=await sharp(old).raw().toBuffer({resolveWithObject:true});assert.deepEqual(a.info,b.info);pixelEqual=a.data.equals(b.data);
   if(!pixelEqual){
    const metrics=async (page,selector)=>page.locator(selector).evaluate(el=>{const range=document.createRange();range.selectNodeContents(el);const box=range.getBoundingClientRect(),root=el.closest('.cp-instruction-example').getBoundingClientRect(),style=getComputedStyle(el);return {x:box.x-root.x,y:box.y-root.y,width:box.width,height:box.height,fontFamily:style.fontFamily,fontSize:style.fontSize,fontWeight:style.fontWeight,color:style.color,lineHeight:style.lineHeight};});
    const now=await metrics(p,'[data-word-audio="oefencursus"]'),oldWord=await metrics(ref,'[data-word-audio-missing]:text-is("oefencursus")');
    for(const key of ['x','y','width'])assert(Math.abs(now[key]-oldWord[key])<0.05,key+' unchanged');
    for(const key of ['fontFamily','fontSize','fontWeight','color','lineHeight'])assert.equal(now[key],oldWord[key],key);
    for(let i=0;i<a.data.length;i+=a.info.channels){if(a.data.subarray(i,i+a.info.channels).equals(b.data.subarray(i,i+a.info.channels)))continue;const pixel=i/a.info.channels,x=pixel%a.info.width,y=Math.floor(pixel/a.info.width);assert(x>=Math.floor(now.x)&&x<=Math.ceil(now.x+now.width)&&y>=Math.floor(now.y)&&y<=Math.ceil(now.y+Math.max(now.height,oldWord.height)),'No changed pixels outside newly clickable word');wordEdgePixels++;}
    assert(wordEdgePixels<=100,'Only the known WebKit glyph-edge rasterization may differ');
   }await ref.close();}
   const played=await clickWord(p,'oefencursus',clips.find(c=>c.word==='oefencursus').src);assert.equal(await p.locator('[role="alert"]').count(),0);assert.equal(await p.evaluate(()=>localStorage.getItem('twenty-audio-preserve')),'saved');
   results.push({engine:name,width,theme,word:'oefencursus',clicked:true,pixelEqual,wordEdgePixels,played,storagePreserved:true});await p.close();
  }
  const p=await browser.newPage({viewport:{width:390,height:950}});await setup(p,'light');await p.goto(base);
  for(const c of [...clips,{word:'we',src:wordAudioIndex.get('we').src}]){
   const played=await p.evaluate(async src=>{const a=new Audio(src);a.muted=true;return await new Promise((resolve,reject)=>{let playing=false;const timeout=setTimeout(()=>{a.pause();reject(Error('Audio timeout'));},10000);a.onplaying=()=>playing=true;a.onerror=()=>{clearTimeout(timeout);reject(Error('Media decode failed'));};a.onended=()=>{clearTimeout(timeout);resolve({playing,ended:true,duration:a.duration,currentTime:a.currentTime});};a.play().catch(reject);});},c.src);
   assert(played.playing&&played.ended&&played.duration>0);results.push({engine:name,word:c.word,src:c.src,nativePlayback:true,...played});
  }
  for(const word of ['kammen','leunen']){
   const c=chapterCollections('verb-choice').find(c=>c.level==='a1'&&c.exercises.some(e=>e.standardTask?.cue==='Werkwoord: '+word));const idx=c.exercises.findIndex(e=>e.standardTask?.cue==='Werkwoord: '+word);
   await p.goto(base+'/'+chapterHash({chapter:'grammar',activity:'verb-choice',collection:c.id,level:c.level,help:'practice'}));await p.locator('[data-exercise-id]').waitFor();
   for(let i=0;i<idx;i++){const e=c.exercises[i];assert.equal(await p.locator('[data-exercise-id]').getAttribute('data-exercise-id'),e.exerciseId);await p.locator('.cp-exercise-browser input').fill(e.standardTask.acceptedAnswers[0]);await p.locator('[data-practice-check]').click();await p.waitForFunction(()=>document.querySelector('[data-practice-ready="true"]'));await p.locator('[data-practice-next]').click();await p.waitForFunction(id=>document.querySelector('[data-exercise-id]')?.getAttribute('data-exercise-id')!==id,e.exerciseId);}
   const played=await clickWord(p,word,clips.find(c=>c.word===word).src);assert.equal(await p.locator('[data-exercise-id]').getAttribute('data-exercise-id'),c.exercises[idx].exerciseId);results.push({engine:name,word,clicked:true,answerUnaffected:true,played});
  }
  await p.close();
 }finally{await browser.close();writeFileSync(new URL('checks.json',out),JSON.stringify({base,reference,results,errors},null,2)+'\n');}
}
assert.deepEqual(errors,[]);assert.equal(results.length,54);console.log('PASS: 54 native playback/integration checks; '+(reference?'8 instruction comparisons, with unchanged geometry and typography':'live checks'));
