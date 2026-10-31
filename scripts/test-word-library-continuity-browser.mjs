import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';
import sharp from 'sharp';
const base=process.env.KLINK_TEST_URL || 'http://127.0.0.1:18982';
const baseline=process.env.KLINK_BASELINE_URL || 'https://klink.taalroute.nl';
const out=process.env.KLINK_CONTINUITY_OUT || 'docs/word-library-menu-20261031/continuity';mkdirSync(out,{recursive:true});
const browser=await chromium.launch(),checks=[];
try{
 for(const width of [1366,390])for(const colorScheme of ['light','dark'])for(const[route,selector]of [['learner/home','.cp-home'],['learner/review','.review-page'],['teacher/plus','.kpd-lessons']]){
  const shots=[];
  for(const[name,url]of [['before',baseline],['after',base]]){
   const page=await browser.newPage({viewport:{width,height:900},colorScheme});
   await page.goto(`${url}/#${route}`);if(route==='teacher/plus')await page.getByRole('button',{name:'Les openen: mat',exact:true}).waitFor();else await page.locator(selector).waitFor();
   await page.evaluate(()=>document.fonts.ready);
   await page.waitForFunction(()=>[...document.images].filter(i=>i.getBoundingClientRect().top<innerHeight).every(i=>i.complete));
   const file=`${out}/${route.replace('/','-')}-${width}-${colorScheme}-${name}.png`;
   shots.push(await page.screenshot({path:file,animations:'disabled'}));await page.close();
  }
  const a=await sharp(shots[0]).removeAlpha().raw().toBuffer(),b=await sharp(shots[1]).removeAlpha().raw().toBuffer();assert.equal(a.length,b.length);
  let different=0;for(let i=0;i<a.length;i+=3)if(Math.max(Math.abs(a[i]-b[i]),Math.abs(a[i+1]-b[i+1]),Math.abs(a[i+2]-b[i+2]))>8)different++;
  const ratio=different/(a.length/3);checks.push({route,width,colorScheme,differentPixels:different,ratio});
  assert(ratio<0.001,`${route} ${width} ${colorScheme}: changed ${(ratio*100).toFixed(3)}%`);
 }
 writeFileSync(`${out}/checks.json`,JSON.stringify({passed:true,checks},null,2));console.log('PASS',checks.length,'unchanged-screen comparisons');
}finally{await browser.close();}
