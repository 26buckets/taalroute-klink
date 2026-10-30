import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { chromium, webkit } from 'playwright';
import { displayedChapterCollections, selectedChapterCollection, chapterExerciseChoices, chapterHash, parseChapterHash } from '../lib/practice-chapters.ts';
import { wordRoundActivities } from '../lib/word-rounds.ts';
import { collectionProgressId, roundProgressPrefix } from '../lib/round-progress.ts';
import { groupSessionKey } from '../lib/group-practice.ts';
const base = process.env.KLINK_TEST_URL ?? 'http://127.0.0.1:18971';
const out = process.env.KLINK_CONTINUITY_OUTPUT ?? 'outputs/word-round-continuity-20261031/browser';
mkdirSync(out,{recursive:true});
const results=[], errors=[];
const url=l=>base+'/'+chapterHash(l);
const sort=ids=>[...new Set(ids)].sort((a,b)=>a.localeCompare(b));
for(const [engine,type] of Object.entries({chromium,webkit})) {
 const browser=await type.launch();
 try {
  const page=await browser.newPage();page.setDefaultTimeout(20000);page.on('pageerror',e=>errors.push(e.message));
  const requests=[];page.on('request',r=>requests.push(r.url()));
  let overviews=0, opened=0, switched=0;
  for(const [width,height] of [[1366,900],[320,480]]) {
   await page.setViewportSize({width,height});
   for(const activity of wordRoundActivities) for(const level of ['alfa-a','b1']) {
    const selection={chapter:activity==='meet'||['same-word','listen','hear-word','read','match','hear-match','cards','word-sort'].includes(activity)?'words':['build-model','build','worksheet','worksheet-heard','missing','dictation'].includes(activity)?'spelling':['copy','write','paper-dictation'].includes(activity)?'writing':activity==='speak'?'speaking':'repeat',activity,level,help:'practice'};
    const first=displayedChapterCollections(activity,selection).find(c=>c.wordRound);
    if(!first)continue;
    requests.length=0;await page.goto(url(selection));await page.locator('[data-collection]').first().waitFor();
    assert(!requests.some(r=>r.includes('/practice-content/')),'Overview never loads exercise banks');
    const card=page.locator(`[data-collection="${first.id}"]`);await card.waitFor();
    assert.equal(await card.locator('.cp-beta-count').innerText(),`${first.wordRound.wordIds.length} ${first.wordRound.wordIds.length===1?'woord':'woorden'}`);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));overviews++;
    await card.click();await page.locator(`[data-exercise-id="${first.wordRound.exerciseIds[0]}"], [data-worksheet-exercise="${first.wordRound.exerciseIds[0]}"]`).waitFor();opened++;
    await page.getByRole('button',{name:'Andere opdracht',exact:true}).click();await card.waitFor();
    await page.waitForFunction(id=>document.activeElement?.getAttribute('data-collection')===id,first.id);
   }
  }
  await page.close();
  for(const [width,height]of [[390,844],[844,390],[768,1024]]) {
   const touch=await browser.newPage({viewport:{width,height},hasTouch:true});touch.on('pageerror',e=>errors.push(e.message));
   for(const level of ['alfa-a','alfa-b','alfa-c','a1','a2','b1']) {
    const selection={chapter:'words',activity:'meet',level,help:'practice'};
    const child=displayedChapterCollections('meet',selection).find(c=>c.wordRound&&c.wordRound.wordIds.length>1);
    if(!child)continue;
    let location={...selection,collection:child.id};await touch.goto(url(location));await touch.locator('[data-exercise-id]').first().waitFor();
    const choices=chapterExerciseChoices(location);
    for(const choice of choices.filter(c=>c.id!=='meet')) {
     await touch.getByRole('button',{name:'Andere oefening',exact:true}).tap();
     await touch.getByRole('group',{name:'Met dezelfde woorden',exact:true}).waitFor();
     await touch.locator(`[data-exercise-choice="${choice.id}"]`).tap();
     await touch.waitForFunction(activity=>location.hash.includes('/'+activity+'/'),choice.id);
     location=parseChapterHash(new URL(touch.url()).hash);
     assert.deepEqual(sort(location.words),sort(child.wordRound.wordIds));
     const selected=selectedChapterCollection(location);await touch.locator(`[data-exercise-id="${selected.wordRound.exerciseIds[0]}"], [data-worksheet-exercise="${selected.wordRound.exerciseIds[0]}"]`).waitFor();
     const rendered=await touch.locator('[data-exercise-id], [data-worksheet-exercise]').evaluateAll(es=>es.map(e=>e.dataset.exerciseId??e.dataset.worksheetExercise));
     assert(rendered.every(id=>selected.wordRound.exerciseIds.includes(id)),'Only tasks for the chosen words render');
     assert(await touch.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));switched++;
     await touch.reload();await touch.locator(`[data-exercise-id="${selected.wordRound.exerciseIds[0]}"], [data-worksheet-exercise="${selected.wordRound.exerciseIds[0]}"]`).waitFor();
     assert.deepEqual(sort(parseChapterHash(new URL(touch.url()).hash).words),sort(child.wordRound.wordIds));
    }
    await touch.getByRole('button',{name:'Andere opdracht',exact:true}).tap();await touch.locator('[data-collection]').first().waitFor();
    await touch.waitForFunction(()=>Boolean(document.activeElement?.getAttribute('data-collection')));
   }
   await touch.close();
  }
  const native=await browser.newPage({viewport:{width:390,height:844},hasTouch:true});native.on('pageerror',e=>errors.push(e.message));
  await native.addInitScript(()=>{window.__played=[];const play=Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype,'play').value;HTMLMediaElement.prototype.play=function(){this.addEventListener('ended',()=>window.__played.push(this.currentSrc),{once:true});return play.call(this)};});
  const selection={chapter:'words',activity:'meet',level:'b1',help:'practice'};
  const child=displayedChapterCollections('meet',selection).find(c=>c.wordRound);
  const source=JSON.parse(readFileSync('public'+child.contentUrl)).exercises;
  const parentKey=roundProgressPrefix+collectionProgressId('meet',child.wordRound.sourceId,child.contentUrl);
  const oldSession=groupSessionKey(`chapter:meet:${child.wordRound.sourceId}`,'meet');
  const prior=JSON.stringify({version:1,total:source.length,done:[source.at(-1).exerciseId]});
  const cursor=JSON.stringify({version:1,exerciseId:child.wordRound.exerciseIds[0],done:false});
  await native.goto(url(selection));await native.locator('[data-collection]').first().waitFor();
  await native.evaluate(({parentKey,oldSession,prior,cursor})=>{localStorage.setItem(parentKey,prior);localStorage.setItem(oldSession,cursor);localStorage.setItem('klink.continuity.sentinel','unchanged')},{parentKey,oldSession,prior,cursor});
  await native.goto(url({...selection,collection:child.id}));await native.locator('.cp-model-content').waitFor();
  await native.locator('.cp-model-content').tap();
  const target=source.find(e=>e.exerciseId===child.wordRound.exerciseIds[0]);await native.waitForFunction(src=>window.__played.some(u=>u.endsWith(src)),target.prompt.audio.src);
  await native.locator('.cp-exercise-feedback').getByRole('button',{name:'Verder',exact:true}).tap();
  await native.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).done.length===2,parentKey);
  const saved=await native.evaluate(k=>localStorage.getItem(k),parentKey);
  await native.getByRole('button',{name:'Andere oefening',exact:true}).tap();await native.locator('[data-exercise-choice="cards"]').tap();
  const destination=selectedChapterCollection(parseChapterHash(new URL(native.url()).hash));await native.locator(`[data-exercise-id="${destination.wordRound.exerciseIds[0]}"]`).waitFor();
  await native.reload();await native.locator('[data-exercise-id]').first().waitFor();
  assert.equal(await native.evaluate(k=>localStorage.getItem(k),parentKey),saved);
  assert.equal(await native.evaluate(k=>localStorage.getItem(k),oldSession),cursor);
  assert.equal(await native.evaluate(()=>localStorage.getItem('klink.continuity.sentinel')),'unchanged');
  await native.getByRole('button',{name:'Andere oefening',exact:true}).tap();await native.screenshot({path:`${out}/${engine}-same-words-mobile.png`});
  results.push({engine,overviews,opened,switched,widths:[1366,320,390,844,768],levels:6,nativeAudio:true,legacyCursor:true,parentCompletion:true,reload:true,touch:true});
  await native.close();
 }finally{await browser.close()}
}
assert.deepEqual(errors,[]);writeFileSync(out+'/checks.json',JSON.stringify({base,results,errors,physicalDevices:false},null,2));console.log('PASS word round continuity browser',JSON.stringify(results));
