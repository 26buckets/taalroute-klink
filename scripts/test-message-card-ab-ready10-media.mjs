import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {chromium,webkit} from 'playwright';
import {chapterHash} from '../lib/practice-chapters.ts';
import {recordingForWord,wordRecordingKey} from '../lib/word-listening.ts';
const d='docs/message-card-ab-ready10-20261104',m=JSON.parse(readFileSync(d+'/manifest.json')),bank=JSON.parse(readFileSync(d+'/source-bank.json')),clip=m.reusedRina,base=process.env.BASE_URL||'http://127.0.0.1:19111';
const result={bytesEqual:false,decodes:[],native:[],wordButtons:[],errors:[],humanListeningPerformed:false};
const bytes=Buffer.from(await (await fetch(base+clip.source)).arrayBuffer());assert.equal(createHash('sha256').update(bytes).digest('hex'),clip.sha256);result.bytesEqual=true;assert.equal(recordingForWord('Rina'),clip.source);
try{for(const[engine,type]of Object.entries({chromium,webkit})){
 const browser=await type.launch({headless:true,...(engine==='chromium'?{channel:'chrome'}:{})});try{const page=await browser.newPage({viewport:{width:390,height:844}});page.on('pageerror',e=>result.errors.push(e.message));await page.addInitScript(()=>{window.mediaEnded=[];window.addEventListener('klink-audio-source',e=>{const a=e.detail;a.addEventListener('ended',()=>window.mediaEnded.push({src:a.dataset.klinkSource,native:a instanceof HTMLAudioElement,duration:a.duration}));});});
 await page.goto(base+'/'+chapterHash({chapter:'writing',activity:'functional-form',collection:m.row.id,level:'alfa-b',help:'practice'}));
 const decoded=await page.evaluate(async src=>{const context=new AudioContext();const audio=await context.decodeAudioData(await(await fetch(src)).arrayBuffer());const duration=audio.duration;await context.close();return duration;},clip.source);assert(decoded>0.5);result.decodes.push({engine,duration:decoded});
 for(const e of bank.exercises.slice(0,4)){const task=page.locator(`[data-writing-form-source="${e.exerciseId}"]`);await task.waitFor();await page.waitForFunction(id=>!document.querySelector(`[data-writing-form-source="${id}"] input`)?.disabled,e.exerciseId);for(const f of e.fields)await task.locator(`[data-form-field="${f.id}"]`).fill(f.acceptedAnswers[0]);await task.getByRole('button',{name:'Controleer',exact:true}).click();await page.waitForFunction(id=>document.querySelector(`[data-exercise-id="${id}"]`)?.getAttribute('data-practice-ready')==='true',e.exerciseId);await page.locator('[data-practice-next]').click();}
 const task=page.locator('[data-writing-form-source="KSW-N26R2-AB-FB-005"]');await task.waitFor();const button=task.locator('button[data-word-audio="Rina"],button[data-word-audio="rina"]').first();await button.click();await page.waitForFunction(src=>window.mediaEnded.some(x=>x.src===src&&x.native&&x.duration>0),wordRecordingKey(recordingForWord('Rina')));result.wordButtons.push({engine,word:'Rina',nativeEnded:true});result.native.push(...await page.evaluate(()=>window.mediaEnded));await page.close();}finally{await browser.close();}
}}finally{writeFileSync((process.env.EVIDENCE_DIR||d+'/local')+'/media.json',JSON.stringify(result,null,2)+'\n');}
assert.equal(result.wordButtons.length,2);assert.deepEqual(result.errors,[]);console.log('Rina: actual offered bytes, two decodes and two real word-button playback completions passed.');
