import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium, webkit } from 'playwright';
import { allPackageWords } from '../lib/package-content.ts';
import index from '../data/klink-word-library-index.json' with { type:'json' };
const base=process.env.KLINK_TEST_URL || 'http://127.0.0.1:18982';
const out=process.env.KLINK_WORD_LIBRARY_OUT || 'docs/word-library-menu-20261031/browser';
mkdirSync(out,{recursive:true});
const checks=[],errors=[];
const savedKey='klink.taalroute.savedWords.v1';
const mat=allPackageWords.find(w=>w.word==='mat'), punct=allPackageWords.find(w=>w.word==="zo'n");
const saved=[mat.id,punct.id,'older-unknown-id'];
for(const[engine,type]of Object.entries({chromium,webkit})){
 const browser=await type.launch();
 try{
  const recovery=await browser.newPage();let attempts=0;
  await recovery.route('**/*klink-word-library-index*',route=>{attempts++;return attempts===1?route.abort():route.continue();});
  await recovery.goto(`${base}/#learner/words`);
  await recovery.getByRole('button',{name:'Probeer opnieuw',exact:true}).waitFor();
  assert.equal(await recovery.locator('.cp-global-word-grid article').count(),24);
  await recovery.getByRole('button',{name:'Probeer opnieuw',exact:true}).click();
  await recovery.waitForFunction(()=>{const level=document.querySelector('select[aria-label="Niveau"]');return level&&!level.disabled;});
  assert(attempts>=2);await recovery.close();checks.push({engine,indexRecovery:true});
  for(const width of [1366,390,320])for(const colorScheme of ['light','dark']){
   const page=await browser.newPage({viewport:{width,height:900},colorScheme});
   page.on('pageerror',e=>errors.push(e.message));
   await page.addInitScript(({savedKey,saved})=>{
    if(!localStorage.getItem(savedKey))localStorage.setItem(savedKey,JSON.stringify(saved));
    window.__audio=[];const play=HTMLMediaElement.prototype.play; // oxlint-disable-line typescript/unbound-method -- Reflect.apply retains the audio receiver.
    HTMLMediaElement.prototype.play=function(...args){const item={src:this.src,ended:false};window.__audio.push(item);this.addEventListener('ended',()=>item.ended=true,{once:true});return Reflect.apply(play,this,args);};
   },{savedKey,saved});
   await page.goto(`${base}/#learner/words`);
   const search=page.getByLabel('Zoek een woord',{exact:true}),source=page.getByLabel('Toon',{exact:true});
   const level=page.getByLabel('Niveau',{exact:true}),chapter=page.getByLabel('Onderdeel',{exact:true});
   const cards=page.locator('.cp-global-word-grid article');
   await search.waitFor();await page.waitForFunction(()=>{const level=document.querySelector('select[aria-label="Niveau"]');return level&&!level.disabled;});
   assert.equal(await cards.count(),24);assert.equal(await source.inputValue(),'all');
   assert.match(await page.locator('.cp-context-meta').innerText(),/5127/);
   assert.equal(await page.getByLabel('Oefening',{exact:true}).count(),0);
   await page.getByRole('button',{name:'Meer woorden tonen',exact:true}).click();assert.equal(await cards.count(),48);
   await search.fill('e-mail');assert.equal(await cards.count(),2);
   if(width===1366&&colorScheme==='light'){
    await cards.filter({has:page.getByText('e-mail',{exact:true})}).locator('.cp-word-listen').click();
    await page.waitForFunction(()=>window.__audio.at(-1)?.ended);
    assert((await page.evaluate(()=>window.__audio.at(-1).src)).endsWith(allPackageWords.find(w=>w.word==='e-mail').audio));
   }
   await search.fill('pak (');assert.equal(await cards.count(),2);
   assert.match((await cards.allInnerTexts()).join('\n'),/pak \(kleding\)/);
   await search.fill('');await page.locator('.word-filter-details summary').click();await source.selectOption('saved');assert.equal(await cards.count(),2);
   await page.getByRole('button',{name:'Bewaard: mat, niet meer bewaren',exact:true}).click();
   assert.deepEqual(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),savedKey),[punct.id,'older-unknown-id']);
   await source.selectOption('all');await search.fill('mat');await page.getByRole('button',{name:'Bewaar: mat',exact:true}).click();
   await page.reload();await page.locator('.word-filter-details summary').click();await source.selectOption('saved');assert.equal(await cards.count(),2);
   await search.fill('woord-dat-niet-bestaat');await page.getByRole('heading',{name:'Geen woorden gevonden'}).waitFor();
   assert.equal(await page.getByRole('heading',{name:'Nog geen woorden bewaard'}).count(),0);
   await page.getByRole('button',{name:'Wis zoeken en filters'}).click();assert.equal(await source.inputValue(),'saved');assert.equal(await cards.count(),2);
   await source.selectOption('all');await page.waitForFunction(()=>{const level=document.querySelector('select[aria-label="Niveau"]');return level&&!level.disabled;});
   await level.selectOption('a1');await chapter.selectOption('words');
   const sample=index.collections.find(row=>row.activity==='meet'&&row.levels.a1?.length>0&&row.levels.a1.length<=8);
   assert(sample);await page.getByLabel('Oefening',{exact:true}).selectOption(sample.id);
   assert.equal(await cards.count(),sample.levels.a1.length);
   const actual=await cards.locator('strong').allTextContents();
   for(const id of sample.levels.a1)assert(actual.includes(allPackageWords.find(w=>w.id===id).word));
   await level.selectOption('b1');assert.equal(await chapter.inputValue(),'all');assert.equal(await page.getByLabel('Oefening',{exact:true}).count(),0);
   await level.selectOption('all');await search.fill('aardappel');
   await page.waitForFunction(()=>[...document.querySelectorAll('.cp-global-word-grid img')].every(img=>img.complete&&img.naturalWidth>0));
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   for(const input of await page.locator('.word-filters select,.word-filters input').all()){const box=await input.boundingBox();assert(box.height>=48&&box.x>=0&&box.x+box.width<=width+1);}
   await page.screenshot({path:`${out}/${engine}-${width}-${colorScheme}.png`});
   assert.deepEqual((await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),savedKey)).sort(),saved.slice().sort());
   checks.push({engine,width,colorScheme,cards:5127,initial:24,search:true,exerciseMapping:true,savedReload:true,images:true,audio:width===1366&&colorScheme==='light'});
   await page.close();
  }
 }finally{await browser.close();}
}
assert.deepEqual(errors,[]);writeFileSync(`${out}/checks.json`,JSON.stringify({passed:true,checks,errors},null,2));console.log('PASS',checks.length,'word-library cases');
