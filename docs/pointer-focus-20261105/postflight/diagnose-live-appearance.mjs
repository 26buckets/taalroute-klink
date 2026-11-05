import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
const require=createRequire(process.cwd()+'/package.json'),{chromium,webkit}=require('playwright'),sharp=require('sharp');
const {chapterHash}=await import(pathToFileURL(process.cwd()+'/lib/practice-chapters.ts'));
const phase=process.argv[2],expected=process.argv[3],out='../focus-checks/live-appearance';assert(['before','after'].includes(phase));mkdirSync(out,{recursive:true});
const release=await(await fetch('https://klink.taalroute.nl/release.json')).json();assert.equal(release.sourceCommit,expected);
const row=JSON.parse(readFileSync('docs/speaking-a1-repeat-20261105/manifest.json')).row,route=chapterHash({chapter:'speaking',activity:'speak',collection:row.id,level:'a1',help:'practice'}),checks=[];
for(const[engine,type]of Object.entries({chromium,webkit})){
 const browser=await type.launch();try{for(const width of [390,1366])for(const theme of ['light','dark']){
  const context=await browser.newContext({viewport:{width,height:900},colorScheme:theme,reducedMotion:'reduce'}),page=await context.newPage();await page.addInitScript(theme=>localStorage.setItem('taalroute-klink-appearance-v1',theme),theme);
  await page.goto('https://klink.taalroute.nl/'+route);await page.locator('.cp-exercise-info-heading').waitFor();await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(500);await page.waitForFunction(()=>!document.querySelector('[data-audio-active="true"]'));await page.waitForTimeout(200);
  const heading=await page.locator('.cp-exercise-info-heading').boundingBox(),geometry=await page.locator('.cp-exercise-info-heading,.cp-task-card,.cp-exercise-stage').evaluateAll(nodes=>nodes.map(el=>({text:el.textContent,rect:el.getBoundingClientRect().toJSON()})));
  const name=`${engine}-${width}-${theme}`,file=`${out}/${name}-${phase}.png`;await page.screenshot({path:file,fullPage:true,animations:'disabled'});
  const record={engine,width,theme,heading,geometry};
  if(phase==='after'){
   const previous=JSON.parse(readFileSync(`${out}/${name}-before.json`));assert.deepEqual(geometry,previous.geometry);
   const a=await sharp(`${out}/${name}-before.png`).ensureAlpha().raw().toBuffer({resolveWithObject:true}),b=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});assert.deepEqual(a.info,b.info);let changedInside=0,changedOutside=0;
   for(let i=0;i<a.data.length;i+=4)if([0,1,2,3].some(k=>Math.abs(a.data[i+k]-b.data[i+k])>2)){const x=i/4%a.info.width,y=Math.floor(i/4/a.info.width);if(x>=heading.x-6&&x<=heading.x+heading.width+6&&y>=heading.y-6&&y<=heading.y+heading.height+6)changedInside++;else changedOutside++;}
   Object.assign(record,{changedInside,changedOutside});
  }
  writeFileSync(`${out}/${name}-${phase}.json`,JSON.stringify(record,null,2)+'\n');checks.push(record);await context.close();
 }}finally{await browser.close();}
}
writeFileSync(`${out}/${phase}.json`,JSON.stringify({release,checks},null,2)+'\n');console.log('CAPTURED',phase,checks.length,'live appearance comparisons',checks.map(x=>({name:[x.engine,x.width,x.theme].join('-'),outside:x.changedOutside})));
