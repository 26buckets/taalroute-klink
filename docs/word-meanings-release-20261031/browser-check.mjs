import assert from'node:assert/strict';import{readFileSync as read,writeFileSync as write}from'node:fs';import{chromium,webkit}from'playwright';import{productionIndex,exerciseWord}from'../../lib/production-practice.ts';import{chapterHash,practiceChapters}from'../../lib/practice-chapters.ts';import{groupSessionKey}from'../../lib/group-practice.ts';
const dir='docs/word-meanings-release-20261031',base=process.env.KLINK_TEST_URL??'http://127.0.0.1:18933';const checks=[];const errors=[];
const cases=[['pak','a2','copy'],['want','a2','copy'],['regent','b1','copy'],['zinnen','b1','read-series'],['voorkomen','a2','read-series'],['godverdomme','b1','copy'],['adequaat','b1','read-series']];
for(const [engine,type]of Object.entries({chromium,webkit})){
 const b=await type.launch({headless:true});try{for(const width of[1366,390]){const page=await b.newPage({viewport:{width,height:width===390?844:900}});page.on('pageerror',e=>errors.push(e.message));
 for(const[word,level,activity]of cases){
 let row,target;for(const r of productionIndex.filter(r=>r.activity===activity&&r.level===level)){const e=JSON.parse(read('public'+r.url)).exercises.find(e=>exerciseWord(e)===word);if(e){row=r;target=e;break;}}assert(target,word);
 const id=row.id+(['godverdomme','adequaat'].includes(word)?'~extension':'');
 await page.goto('about:blank');await page.goto(base+'/#learner/home');await page.locator('.cp-home').waitFor();await page.evaluate(()=>localStorage.clear());const key=groupSessionKey('chapter:'+activity+':'+id,activity);await page.evaluate(({key,e})=>localStorage.setItem(key,JSON.stringify({version:1,exerciseId:e,done:false})),{key,e:target.exerciseId});
 const hash=chapterHash({chapter:practiceChapters.find(c=>c.activities.includes(activity)).id,activity,collection:id,level,help:row.help});await page.goto(base+'/'+hash);await page.reload();await page.locator(`[data-exercise-id="${target.exerciseId}"]`).waitFor();
 if(word==='godverdomme'){assert.equal(await page.locator('.cp-text-entry input').count(),0);await page.getByRole('button',{name:'In een beleefd gesprek met een onbekende.',exact:true}).click();await page.locator('.cp-exercise-feedback.wrong').waitFor();await page.getByRole('button',{name:'Je kunt het horen als iemand erg boos is. Het kan anderen kwetsen.',exact:true}).click();await page.locator('.cp-exercise-feedback.right').waitFor();}
 else if(word==='adequaat'){assert((await page.getByRole('complementary',{name:'Betekenis en voorbeeld'}).innerText()).includes('haalt hulp'));}
 else{const panel=page.getByRole('complementary',{name:'Betekenissen in een situatie'});await panel.waitFor();assert((await panel.innerText()).toLowerCase().includes(word==='zinnen'?'meer dan één zin':word==='regent'?'het regent':word));const switches=panel.locator('button[aria-pressed]');if(await switches.count()>1){await switches.nth(1).click();assert.equal(await switches.nth(1).getAttribute('aria-pressed'),'true');await switches.first().click();}
 if(activity==='copy'){const input=page.locator('.cp-text-entry input');await input.fill('zzzfout');await input.press('Enter');await page.locator('.cp-exercise-feedback.wrong').waitFor();await input.fill(word);await input.press('Enter');await page.locator('.cp-exercise-feedback.right').waitFor();}}
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 await page.screenshot({path:`${dir}/${engine}-${width}-${word}.png`});checks.push({engine,width,word,activity,url:base+'/'+hash,checked:true});
 }
 await page.close();}}finally{await b.close();}
}
assert.deepEqual(errors,[]);write(dir+(base.startsWith('https:')?'/live-browser.json':'/browser.json'),JSON.stringify({checks,errors},null,2));console.log(checks.length+' linked scenarios passed');
