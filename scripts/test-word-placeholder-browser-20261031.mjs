import assert from 'node:assert/strict';
import {writeFileSync,mkdirSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
import {allPackageWords} from '../lib/package-content.ts';
const base=process.env.KLINK_TEST_URL||'http://127.0.0.1:18984';
const out=process.env.KLINK_PLACEHOLDER_OUT||'docs/word-placeholder-20261031/browser';mkdirSync(out,{recursive:true});
const checks=[],errors=[],savedKey='klink.taalroute.savedWords.v1';
const adres=allPackageWords.find(w=>w.word==='adres'),longest=allPackageWords.filter(w=>!w.image).sort((a,b)=>b.word.length-a.word.length)[0];
const samples=[
 ['meet','word-meet:alfa-c:HMM_C06~words-2','model'],
 ['listen','beta-images:listen:alfa-c:HMM_C06~words-1','heard-image'],
 ['read','beta-images:read:alfa-c:HMM_C06~words-1','word-image'],
 ['match','beta-images:match:alfa-c:HMM_C06~words-1','word-image-match'],
 ['cards','beta-images:cards:alfa-c:HMM_C06~words-2','word-card'],
];
for(const[engine,type]of Object.entries({chromium,webkit})){
 const browser=await type.launch();
 try{
  for(const width of [1366,390,320])for(const colorScheme of ['light','dark']){
   const page=await browser.newPage({viewport:{width,height:900},colorScheme});page.setDefaultTimeout(30000);page.on('pageerror',e=>errors.push(e.message));
   await page.addInitScript(({key,id})=>{if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify([id,'older-unknown-id']));},{key:savedKey,id:adres.id});
   await page.goto(base+'/#learner/words');
   const search=page.getByLabel('Zoek een woord',{exact:true});await search.fill('adres');
   const card=page.locator('.cp-global-word-grid article').filter({has:page.getByText('adres',{exact:true})});
   assert.equal(await card.locator('.klink-placeholder-word').innerText(),'adres');
   assert.equal(await card.locator('.word-initial').count(),0);
   assert.equal(await page.evaluate(()=>document.documentElement.dataset.theme),colorScheme);
   const opacity=await card.locator('.klink-word-placeholder').evaluate(el=>getComputedStyle(el,'::after').opacity);assert.equal(opacity,'0.035');
   await card.screenshot({path:`${out}/${engine}-${width}-${colorScheme}-library.png`});
   await search.fill(longest.word);assert.equal(await page.locator('.klink-placeholder-word').first().innerText(),longest.word);
   await page.goto(base+'/#learner/review');await page.locator('.klink-review-placeholder').waitFor();
   assert.equal(await page.locator('.klink-review-placeholder').innerText(),'adres');
   await page.locator('.review-word-list').screenshot({path:`${out}/${engine}-${width}-${colorScheme}-review.png`});
   await page.reload();await page.locator('.klink-review-placeholder').waitFor();
   assert.deepEqual(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),savedKey),[adres.id,'older-unknown-id']);
   // Every currently image-less word must fit the actual smallest saved-word holder.
   if(width===1366&&colorScheme==='light'){
    const failures=await page.locator('.klink-review-placeholder').evaluate((sample,words)=>{
     const stage=document.createElement('div');stage.className='learner-app';stage.style.cssText='position:absolute;left:0;top:0;visibility:hidden';document.body.append(stage);
     const failed=[];for(const size of [80,104]){
      const nodes=words.map(word=>{const n=sample.cloneNode(true);n.className='cp-word-placeholder klink-word-placeholder';n.style.cssText=`width:${size}px;height:${size}px;position:absolute;left:0;top:0`;if(word.length>16)n.dataset.longWord='true';else delete n.dataset.longWord;n.firstElementChild.textContent=word;stage.append(n);return n;});
      for(const n of nodes){const t=n.firstElementChild;if(t.scrollHeight>t.clientHeight+1||t.scrollWidth>t.clientWidth+1)failed.push({word:t.textContent,size});}stage.replaceChildren();
     }stage.remove();return failed;
    },allPackageWords.filter(w=>!w.image).map(w=>w.word));
    assert.deepEqual(failures,[]);checks.push({engine,allMissingWordsFit:allPackageWords.filter(w=>!w.image).length,sizes:[80,104]});
   }
   for(const[activity,id,mode]of samples){
    await page.goto(base+'/#learner/chapters/words/'+activity+'/'+encodeURIComponent(id)+'?level=alfa-c&help=practice');
    const holders=page.locator('.klink-word-placeholder');await holders.first().waitFor();
    assert.equal(await page.locator('.cp-word-placeholder:not(.klink-word-placeholder)').count(),0);
    const fit=await holders.evaluateAll(xs=>xs.every(el=>{const t=el.querySelector('.klink-placeholder-word');return t.textContent.trim()&&t.scrollHeight<=t.clientHeight+1&&t.scrollWidth<=t.clientWidth+1;}));assert(fit,`${engine} ${width} ${mode}`);
    if(width!==320)await page.locator('.cp-exercise-stage').screenshot({path:`${out}/${engine}-${width}-${colorScheme}-${mode}.png`});
    checks.push({engine,width,colorScheme,mode,holders:await holders.count(),wordFits:true});
   }
   await page.goto(base+'/#learner/words');await search.fill('aardappel');
   const image=page.locator('.cp-word-listen').filter({has:page.getByText('aardappel',{exact:true})}).locator('img');await image.evaluate(el=>el.decode());
   const src=await image.getAttribute('src');assert(src&&!src.includes('placeholder'));
   if(width===1366&&colorScheme==='light'){
    await page.route('**'+src,route=>route.abort());await page.reload();await search.fill('aardappel');
    await page.locator('.cp-word-listen').filter({has:page.getByText('aardappel',{exact:true})}).locator('.klink-placeholder-word').waitFor();
    assert.equal(await page.locator('.cp-word-listen').filter({has:page.getByText('aardappel',{exact:true})}).locator('.klink-placeholder-word').innerText(),'aardappel');
    await page.unroute('**'+src);await page.reload();await search.fill('aardappel');await page.locator('.cp-word-listen').filter({has:page.getByText('aardappel',{exact:true})}).locator('img').evaluate(el=>el.decode());
    checks.push({engine,failedImageFallback:true,originalImageRecovers:true});
    await page.goto(base+'/#learner/package/'+adres.packageId);await page.locator('.cp-tabs').getByRole('button',{name:'Woorden',exact:true}).click();
    const packageWord=page.getByRole('button',{name:'Luister naar adres',exact:true});await packageWord.locator('.klink-package-placeholder').waitFor();assert.equal(await packageWord.locator('.klink-placeholder-word').innerText(),'adres');
    checks.push({engine,packageWords:true});
   }
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   checks.push({engine,width,colorScheme,library:true,review:true,savedWordsPreserved:true,existingImage:true,opacity});await page.close();
  }
 }finally{await browser.close();}
}
assert.deepEqual(errors,[]);writeFileSync(out+'/checks.json',JSON.stringify({passed:true,checks,errors},null,2));console.log('PASS',checks.length,'placeholder cases; original images, saved words and all missing-word lengths preserved');
