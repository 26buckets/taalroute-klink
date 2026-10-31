import { compactImageSrc } from '../lib/compact-images.ts';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
import {productionIndex} from '../lib/production-practice.ts';
import {groupSessionKey} from '../lib/group-practice.ts';
import {chapterHash,practiceChapters} from '../lib/practice-chapters.ts';
const report=JSON.parse(readFileSync(process.env.KLINK_IMAGE_REPORT||'docs/drive-images-20261031/media.json')),base=process.env.KLINK_TEST_URL||'http://127.0.0.1:18975',out=process.env.KLINK_IMAGE_OUTPUT||'docs/drive-images-20261031/screens';mkdirSync(out,{recursive:true});
const data=row=>JSON.parse(readFileSync('public'+row.url)).exercises,url=row=>base+'/'+chapterHash({chapter:practiceChapters.find(c=>c.activities.includes(row.activity)).id,activity:row.activity,collection:row.id,level:row.level,help:row.help});
const jobs=[];
for(const a of report.assets){const row=productionIndex.find(r=>['copy','meet'].includes(r.activity)&&data(r).some(e=>e.prompt?.image?.src===a.url));assert(row,a.word);jobs.push({a,row,ex:data(row).find(e=>e.prompt?.image?.src===a.url)});}
const checks=[],errors=[];
assert.equal(jobs.length,report.assets.length);
for(const [engine,type]of Object.entries({chromium,webkit})){const browser=await type.launch();try{const page=await browser.newPage();page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(()=>{window.__played=[];window.Audio=class extends EventTarget{constructor(src){super();this.src=src;this.paused=true;}play(){window.__played.push(this.src);this.paused=false;this.t=setTimeout(()=>{this.paused=true;this.dispatchEvent(new Event('ended'));},40);return Promise.resolve();}pause(){clearTimeout(this.t);this.paused=true;}load(){}removeAttribute(){}};});
 for(const width of [1366,390]){await page.setViewportSize({width,height:950});for(const {a,row,ex}of (process.env.KLINK_BINGO_ONLY?[]:jobs)){await page.goto(base+'/#learner/home');await page.evaluate(({key,id})=>{localStorage.clear();localStorage.setItem(key,JSON.stringify({version:1,done:false,exerciseId:id}));},{key:groupSessionKey(`chapter:${row.activity}:${row.id}`,row.activity),id:ex.exerciseId});await page.goto(url(row));const stage=page.locator(`[data-exercise-id="${ex.exerciseId}"]`);await stage.waitFor().catch(async e=>{console.log(a.word,url(row),await page.locator("body").innerText());throw e;});const img=stage.locator('img').first();await img.evaluate(el=>el.decode()).catch(async e=>{console.log(engine,width,a.word,await img.getAttribute("src"));throw e;});const src=await img.getAttribute('src');assert(src===compactImageSrc(a.url)||new URL(src,base).searchParams.get('url')===compactImageSrc(a.url));const dimensions=await img.evaluate(e=>({width:e.clientWidth,height:e.clientHeight,naturalWidth:e.naturalWidth,naturalHeight:e.naturalHeight}));assert(dimensions.width>0&&dimensions.height>0);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));if(engine==='chromium'&&width===1366)await stage.screenshot({path:out+'/'+a.word+'.png'});checks.push({engine,width,code:a.word,placed:true,...dimensions});}

 }
 }finally{await browser.close();}}
assert.deepEqual(errors,[]);writeFileSync(out+(process.env.KLINK_BINGO_ONLY?'/bingo-browser.json':'/browser.json'),JSON.stringify({checks,errors},null,2));console.log('PASS',checks.length,'placed images and complete bingo flows');
