import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
import {productionIndex} from '../lib/production-practice.ts';
import {chapterHash,practiceChapters} from '../lib/practice-chapters.ts';
const report=JSON.parse(readFileSync('docs/image-repairs-20261030/media.json'));
const base=process.env.KLINK_URL||'http://127.0.0.1:18937',out=process.env.KLINK_IMAGE_OUTPUT||'outputs/image-repairs-20261030';mkdirSync(out,{recursive:true});
const seen=new Set(),jobs=[];
for(const row of productionIndex){
 const changes=report.wordCollections.find(c=>c.id===row.id);
 if(!changes&&!report.newCollections.some(c=>c.id===row.id))continue;
 const data=JSON.parse(readFileSync('public'+row.url));
 for(const ex of data.exercises){if(seen.has(ex.exerciseId)||!report.assets.some(a=>a.url===ex.prompt?.image?.src))continue;seen.add(ex.exerciseId);jobs.push({row,ex,data,changes});}
}
assert.equal(new Set(jobs.map(j=>j.ex.prompt.image.src)).size,8);const checks=[],errors=[];
for(const [name,type] of Object.entries({chromium,webkit})){
 const browser=await type.launch();try{
 const page=await browser.newPage();page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push({message:e.message,stack:e.stack,url:page.url()}));
 await page.addInitScript(()=>{window.__played=[];window.Audio=class extends EventTarget{constructor(src){super();this.src=src;}play(){window.__played.push(this.src);this.t=setTimeout(()=>this.dispatchEvent(new Event('ended')),30);return Promise.resolve();}pause(){clearTimeout(this.t);}};});
 await page.goto(base+'/#learner/home');await page.waitForLoadState('networkidle');
 for(const width of [1366,390]){
 await page.setViewportSize({width,height:950});
 for(const {row,ex,data,changes} of jobs){
  await page.goto(base+'/#learner/home');await page.waitForLoadState('networkidle');
  const key=`klink.group.v1:chapter:${row.activity}:${row.id}:${row.activity}`;
  const progress=changes?`klink.round-progress.v1:collection:${row.activity}:${row.id}:${changes.progressUrl}`:null;
  await page.evaluate(({key,id,progress,ids})=>{localStorage.setItem(key,JSON.stringify({version:1,done:false,exerciseId:id}));if(progress)localStorage.setItem(progress,JSON.stringify({version:1,total:ids.length,done:ids}));},{key,id:ex.exerciseId,progress,ids:data.exercises.map(e=>e.exerciseId)});
  const hash=chapterHash({chapter:practiceChapters.find(c=>c.activities.includes(row.activity)).id,activity:row.activity,collection:row.id,level:row.level,help:row.help});
  await page.goto(base+'/'+hash);const stage=page.locator(`[data-exercise-id="${ex.exerciseId}"]`);await stage.waitFor();
  const pause=page.getByRole('button',{name:'Automatisch verder pauzeren',exact:true});if(await pause.count())await pause.click();
  const img=stage.locator(`img[src="${ex.prompt.image.src}"]`).first();await img.waitFor();await img.evaluate(el=>el.decode());
  const dims=await img.evaluate(el=>({width:el.clientWidth,height:el.clientHeight,naturalWidth:el.naturalWidth,naturalHeight:el.naturalHeight}));assert(dims.width>0&&dims.height>0);assert(dims.naturalWidth<=768&&dims.naturalHeight<=768);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  if(row.activity==='meet'){assert.equal(await stage.locator('.cp-model-sentence > strong').innerText(),ex.text.primary);await stage.locator('.cp-model-sentence').click();await page.waitForFunction(src=>window.__played.includes(src),ex.prompt.audio.src);}
  if(name==='chromium'&&width===1366)await stage.screenshot({path:`${out}/${ex.exerciseId}.png`});
  if(changes){await page.getByRole('button',{name:'Andere opdracht',exact:true}).click();const card=page.locator(`[data-collection="${row.id}"]`);await page.locator('.cp-chapter-collection').first().waitFor();while(!await card.count()&&await page.locator('.cp-chapter-more').count())await page.locator('.cp-chapter-more').click();await card.waitFor();assert((await card.getAttribute('class')).includes('is-complete'),'Existing completed card stays green');}
  checks.push({engine:name,width,id:ex.exerciseId,image:ex.prompt.image.src,...dims,progressPreserved:Boolean(changes)});
 }
 console.log('Checked',name,width,jobs.length);
 }
 }finally{await browser.close();}
}
writeFileSync(`${out}/errors.json`,JSON.stringify(errors,null,2));assert.deepEqual(errors,[]);writeFileSync(`${out}/browser.json`,JSON.stringify({checks,errors},null,2));console.log('PASS',checks.length,'image placements, audio routes and completed cards');
