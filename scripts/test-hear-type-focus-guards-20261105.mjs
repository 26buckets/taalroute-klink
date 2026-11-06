import assert from 'node:assert/strict';
import{mkdirSync,writeFileSync}from'node:fs';
import{chromium,webkit}from'playwright';
import{chapterHash}from'../lib/practice-chapters.ts';
import{writingDictationRounds}from'../lib/writing-dictation.ts';
const base=process.env.KLINK_TEST_BASE||'http://127.0.0.1:19206',out=process.env.KLINK_TEST_OUTPUT||'docs/hear-type-focus-20261105/local';
const row=writingDictationRounds[0],e=row.exercises[0],url=base+'/'+chapterHash({chapter:'writing',activity:'dictation',collection:row.id,level:'alfa-c',help:'practice'}),checks=[];
for(const[engine,kind]of Object.entries({chromium,webkit})){
 const b=await kind.launch(engine==='chromium'?{channel:'chrome'}:{});try{
 const p=await b.newPage();await p.addInitScript(()=>{window.audioEnds=0;window.Audio=class extends EventTarget{constructor(src){super();this.src=src;this.dataset={};this.paused=true;}play(){this.paused=false;this.timer=setTimeout(()=>{this.paused=true;window.audioEnds++;this.dispatchEvent(new Event('ended'));},400);return Promise.resolve();}pause(){clearTimeout(this.timer);this.paused=true;}};});
 await p.goto(url);const task=p.locator('[data-exercise-id="'+e.exerciseId+'"]'),input=task.getByRole('textbox',{name:'Jouw antwoord',exact:true}),listen=task.locator('.cp-exercise-listen');
 await listen.click();await p.waitForFunction(()=>document.activeElement===document.querySelector('.cp-text-entry input'));
 await p.keyboard.type('mijn concept');
 await listen.click();const help=task.getByRole('button',{name:'Help',exact:true});await help.click();await help.focus();
 const helpEnds=await p.evaluate(()=>window.audioEnds);await p.waitForFunction(n=>window.audioEnds>n,helpEnds);
 assert(await help.evaluate(el=>el===document.activeElement));assert.equal(await input.inputValue(),'mijn concept');
 await help.click();await listen.click();await p.waitForFunction(()=>document.activeElement===document.querySelector('.cp-text-entry input'));
 await p.keyboard.press('ArrowLeft');const caret=await input.evaluate(el=>el.selectionStart);await listen.click();await p.waitForFunction(()=>document.activeElement===document.querySelector('.cp-text-entry input'));assert.equal(await input.evaluate(el=>el.selectionStart),caret,'Replay must not select or replace existing text');
 await p.reload();await listen.click();await p.waitForFunction(()=>document.activeElement===document.querySelector('.cp-text-entry input'));assert.equal(await input.inputValue(),'mijn concept');
 await task.locator('[data-practice-automatic]').click();await input.focus();
 await p.keyboard.press('ControlOrMeta+A');await p.keyboard.insertText(e.fields[0].acceptedAnswers[0]);await p.keyboard.press('Enter');await p.waitForFunction(()=>document.activeElement?.hasAttribute('data-inline-next'));
 await listen.click();const n=await p.evaluate(()=>window.audioEnds);await p.waitForFunction(n=>window.audioEnds>n,n);assert(!(await input.evaluate(el=>el===document.activeElement)),'Replay after success must not return to the answer');
 // In a sheet an old playback must not steal focus from another answer.
 await p.getByRole('button',{name:'Op één blad',exact:true}).click();const first=p.locator('[data-sheet-exercise]').nth(0),second=p.locator('[data-sheet-exercise]').nth(1);
 await second.locator('.cp-exercise-listen').click();const secondInput=second.getByRole('textbox',{name:'Jouw antwoord'});await p.waitForFunction(el=>document.activeElement===el,await secondInput.elementHandle());
 await first.locator('.cp-exercise-listen').click();await secondInput.focus();const ends=await p.evaluate(()=>window.audioEnds);await p.waitForFunction(n=>window.audioEnds>n,ends);assert(await secondInput.evaluate(el=>document.activeElement===el));
 checks.push({engine,helpFocusPreserved:true,draftReloadPreserved:true,caretPreserved:true,correctAnswerNotRefocused:true,otherQuestionFocusPreserved:true,simulatedAudio:true});
 }finally{await b.close();}
}
mkdirSync(out,{recursive:true});writeFileSync(out+'/guards.json',JSON.stringify({base,checks},null,2)+'\n');console.log('10 focus guards passed in Chromium/WebKit.');
