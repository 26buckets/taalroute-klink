import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {chromium} from 'playwright';
import {chapterHash} from '../lib/practice-chapters.ts';
const root='docs/reading-comprehension-20261105/',out=process.env.EVIDENCE_DIR||root+'local',base=process.env.BASE_URL||'http://127.0.0.1:19136';mkdirSync(out,{recursive:true});
const sha=b=>createHash('sha256').update(b).digest('hex'),fetchBytes=url=>execFileSync('curl',['-fsS','--max-time','45',url],{maxBuffer:64e6});
const index=JSON.parse(readFileSync('data/klink-production-index.json')),m=JSON.parse(readFileSync(root+'manifest.json')),assets=JSON.parse(readFileSync('data/klink-grammar-aa-assets.json'));
const offered=[];for(const row of [...m.rows,index.find(r=>r.id==='production:write:alfa-b:KSW-N26R2-AB-SO-001-010'),index.find(r=>r.id==='speaking-a1-repeat-20261105')]){const b=fetchBytes(base+row.url),local=row.url.startsWith('/api/')?Buffer.from(assets[row.url.split('/').at(-1)].body,'base64'):readFileSync('public'+row.url);assert.deepEqual(b,local);offered.push({id:row.id,url:row.url,bytes:b.length,sha256:sha(b),exact:true});}
const held=[];for(const{row}of JSON.parse(readFileSync('docs/spelling-dictation-20261104/import-manifest.json')).newRows){const status=execFileSync('curl',['-sS','-o','/dev/null','-w','%{http_code}',base+row.url],{encoding:'utf8'});assert.equal(status,'404');held.push({url:row.url,status:404});}
writeFileSync(out+'/offered-banks.json',JSON.stringify({base,offered,held},null,2)+'\n');
if(process.env.SKIP_APPEARANCE!=='1'){
 const row=index.find(r=>r.id==='speaking-a1-repeat-20261105'),route=chapterHash({chapter:'speaking',activity:'speak',collection:row.id,level:'a1',help:'practice'}),pairs=[];
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{for(const width of [390,1280])for(const color of ['light','dark']){
  const files=[],geometry=[];
  for(const[label,url]of [['before','https://klink.taalroute.nl'],['after',base]]){
   const page=await browser.newPage({viewport:{width,height:900},colorScheme:color});await page.addInitScript(color=>localStorage.setItem('taalroute-klink-appearance-v1',color),color);
   await page.goto(url+'/'+route);await page.locator('[data-exercise-id="SPK-A1-ZHW-01"]').waitFor();await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(1000);assert.equal(await page.evaluate(()=>document.documentElement.dataset.theme),color);
   geometry.push(await page.locator('.cp-exercise-stage,.cp-task-card,.cp-exercise-feedback,.cp-context-header').evaluateAll(nodes=>nodes.map(el=>({className:el.getAttribute('class'),rect:el.getBoundingClientRect().toJSON(),text:el.textContent}))));
   const file=`${out}/appearance-${width}-${color}-${label}.png`;await page.screenshot({path:file,fullPage:true,animations:'disabled'});files.push(file);await page.close();
  }
  assert.deepEqual(geometry[0],geometry[1]);
  const a=await sharp(files[0]).ensureAlpha().raw().toBuffer({resolveWithObject:true}),b=await sharp(files[1]).ensureAlpha().raw().toBuffer({resolveWithObject:true});assert.deepEqual(a.info,b.info);let changedPixels=0,maxChannelDelta=0;for(let i=0;i<a.data.length;i+=4)if(!a.data.subarray(i,i+4).equals(b.data.subarray(i,i+4))){changedPixels++;for(let c=0;c<4;c++)maxChannelDelta=Math.max(maxChannelDelta,Math.abs(a.data[i+c]-b.data[i+c]));}
  pairs.push({width,color,changedPixels,maxChannelDelta,sameControlGeometryAndText:true,geometry:geometry[0]});
 }
 }finally{await browser.close();writeFileSync(out+'/appearance.json',JSON.stringify(pairs,null,2)+'\n');}
 // Dev and production rasterize the unchanged one-pixel frame border by one grey step.
 assert(pairs.every(p=>p.changedPixels===0||(p.maxChannelDelta===1&&p.changedPixels<=841&&p.sameControlGeometryAndText)));
}
console.log('PASS offered new/retained banks, six withdrawn dictation URLs and applicable appearance comparison.');
