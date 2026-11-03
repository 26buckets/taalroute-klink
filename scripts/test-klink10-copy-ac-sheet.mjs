import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
import {chapterHash} from '../lib/practice-chapters.ts';
import {recordingForWord,wordRecordingKey} from '../lib/word-listening.ts';
const root='docs/klink10-copy-ac-20261103',m=JSON.parse(readFileSync(root+'/manifest.json')),bank=JSON.parse(readFileSync('public'+m.row.url));
const base=process.env.KLINK_TEST_BASE||'http://127.0.0.1:19046',out=process.env.KLINK_TEST_OUTPUT||root+'/local';mkdirSync(out,{recursive:true});
const checks=[],native=[],errors=[];
try{for(const[engine,type]of Object.entries({chromium,webkit})){
 const browser=await type.launch({headless:true,...(engine==='chromium'?{channel:'chrome'}:{})});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}});page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.copyNative=[];window.addEventListener('klink-audio-source',event=>{const audio=event.detail;audio.addEventListener('ended',()=>window.copyNative.push({key:audio.dataset.klinkSource,native:audio instanceof HTMLAudioElement}));});});
  await page.goto(base+'/'+chapterHash({chapter:'writing',activity:'copy',collection:m.row.id,level:'alfa-c',help:'practice'}));
  await page.locator('[data-exercise-id="KSW-AC-TN-001"]').waitFor();await page.getByRole('button',{name:'Op één blad',exact:true}).click();
  for(const[i,e]of bank.exercises.entries()){
   const task=page.locator(`[data-sheet-exercise="${e.exerciseId}"]`),input=task.getByRole('textbox',{name:'Jouw antwoord',exact:true});await input.waitFor();
   if(i===0){const key=wordRecordingKey(recordingForWord(e.exampleWord));await task.locator('.cp-task-prompt strong').click();await page.waitForFunction(key=>window.copyNative.some(e=>e.native&&e.key===key),key);native.push({engine,word:e.exampleWord,key,playedToEnd:true});}
   await input.fill(e.exampleWord.toUpperCase());await task.getByRole('button',{name:'Controleer',exact:true}).click();assert.equal(await task.getAttribute('data-practice-ready'),'false');
   await input.fill(e.exampleWord);await task.getByRole('button',{name:'Controleer',exact:true}).click();assert.equal(await task.getAttribute('data-practice-ready'),'true');
   const saved=await page.evaluate(id=>JSON.parse(localStorage.getItem('klink.writing-answer.v1:'+id)),e.exerciseId);assert.equal(saved.first,e.exampleWord.toUpperCase());assert.equal(saved.last,e.exampleWord);
   checks.push({engine,sourceId:e.exerciseId,exactAnswerAndStorage:true});
  }
 }finally{await browser.close();}
}}finally{writeFileSync(out+'/sheet-native.json',JSON.stringify({base,checks,native,errors,simulatedAudio:false,humanListening:false},null,2)+'\n');}
assert.equal(checks.length,20);assert.equal(native.length,2);assert.deepEqual(errors,[]);console.log('20 sheet flows and two native model-word playbacks passed.');
