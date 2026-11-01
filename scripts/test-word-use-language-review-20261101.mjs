import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {wordUseCollections} from '../lib/word-use.ts';
const json=f=>JSON.parse(readFileSync(f));
const folder='docs/word-use-language-review-20261101/';
const bank=json('data/klink-word-use.json'),review=json(folder+'content-review.json'),baseline=json(folder+'baseline.json');
const old=JSON.parse(execFileSync('git',['show',baseline.sourceCommit+':data/klink-word-use.json'],{maxBuffer:16e6}));
const row=(activity,level,theme,number)=>bank.entries.find(e=>e.id==='word-use:'+activity+':'+level+':'+theme+':recall:'+number);

test('all 288 questions and 1152 cards have a source-bound language review while levels, IDs and answer positions stay intact',()=>{
 assert.equal(bank.entries.length,288);assert.equal(review.rows.length,288);assert.equal(review.answerCardsReviewed,1152);assert.equal(review.bankSha256,createHash('sha256').update(readFileSync('data/klink-word-use.json')).digest('hex'));
 assert.equal(review.independentHumanReview,false);assert.equal(review.individualCefrValidated,false);
 for(const e of bank.entries){
  const before=old.entries.find(o=>o.id===e.id),checked=review.rows.find(r=>r.id===e.id);assert(before&&checked);
  for(const key of ['activity','level','theme','collectionId'])assert.equal(e[key],before[key]);
  assert.equal(e.options.length,4);assert.equal(new Set(e.options).size,4);assert.equal(e.options.filter(x=>x===e.answer).length,1);assert.equal(e.options.indexOf(e.answer),before.options.indexOf(before.answer));
  for(const key of ['context','prompt','spokenPrompt','options','answer','explanation'])assert.deepEqual(checked[key],e[key]);
  for(const dim of review.dimensions)assert.equal(checked[dim],true,e.id+':'+dim);
  assert.equal(checked.allFourOptionsReviewed,true);assert.equal(checked.uniqueCorrectAnswer,true);
 }
 for(const activity of ['word-combinations','suitable-reply'])for(const level of ['a1','a2','b1']){
  const rows=bank.entries.filter(e=>e.activity===activity&&e.level===level);assert.equal(rows.length,48);
  assert.deepEqual([0,1,2,3].map(n=>rows.filter(e=>e.options.indexOf(e.answer)===n).length),[12,12,12,12]);
 }
 assert.equal(json(folder+'changes.json').length,139);
});

test('nakomen, vastleggen and bevestigen have different and accurate situations',()=>{
 const a=row('word-combinations','b1','01','01'),b=row('word-combinations','b1','02','06'),c=row('word-combinations','b1','05','04');
 assert.equal(new Set([a.context,b.context,c.context]).size,3);
 assert.equal(a.context,'Ik heb beloofd vrijdag te komen. Ik kom zoals afgesproken.');
 assert.equal(b.context,'We schrijven op wanneer en waar we elkaar ontmoeten.');
 assert.equal(c.context,'Ik stuur een e-mail: onze afspraak voor vrijdag gaat door.');
 assert(a.explanation.includes('Je doet wat je hebt afgesproken'));assert(b.explanation.includes('Je noteert'));assert(c.explanation.includes('Je laat weten'));
});

test('corrected meaning, adjective agreement, dates and spoken gap cues cannot regress',()=>{
 assert.equal(row('suitable-reply','b1','04','02').context,'Je wilt meedenken over een veiligere oversteekplaats.');
 assert.equal(row('suitable-reply','a2','01','04').context,'Je bent onderweg. Je komt over tien minuten aan.');
 const date=row('suitable-reply','b1','01','04');assert(date.context.includes('13 mei'));assert.equal(date.prompt,'De bijeenkomst is op 12 mei.');assert(date.answer.includes('13 mei'));
 assert.equal(row('word-combinations','a2','05','05').spokenPrompt,'me voor een cursus');assert.equal(row('word-combinations','a2','06','08').spokenPrompt,'bedankt');
 for(const e of bank.entries)assert.equal(e.spokenPrompt,e.activity==='word-combinations'?e.prompt.split('…')[0].trim():e.prompt);
 const text=JSON.stringify(bank.entries.map(e=>e.options));
 for(const bad of ['Tot morgen, graag.','Hoe laat begint de trein?','Kunt u mij gisteren terugbellen?','hoewel dat niet lukt','ik vraag niet','ik vertel niets over','zonder een nieuwe datum','elke taal zonder fouten'])assert(!text.includes(bad),bad);
});

test('all revised cards resolve complete audio, and all existing published bindings remain byte-for-byte equal',()=>{
 const bindings=json('data/klink-word-use-audio.json'),prior=JSON.parse(execFileSync('git',['show',baseline.sourceCommit+':data/klink-word-use-audio.json'],{maxBuffer:16e6}));
 for(const[key,value]of Object.entries(prior))assert.deepEqual(bindings[key],value,key);
 for(const collection of wordUseCollections)for(const e of collection.exercises){
  assert(e.instructionAudio?.src);assert(e.prompt.audio?.src);assert.equal(e.options.length,4);assert(e.options.every(o=>o.audio?.src));
  assert.deepEqual(e.textBlocks.slice(1).map(b=>b.audio.src),e.options.map(o=>o.audio.src));
  for(const src of [e.instructionAudio.src,e.prompt.audio.src,...e.options.map(o=>o.audio.src)])assert(existsSync('public'+src));
 }
 const plan=json(folder+'voice-plan.json'),audio=json(folder+'audio.json');assert.equal(audio.length,plan.clips.length);assert.equal(audio.filter(c=>!c.reused).length,203);
 for(const clip of audio){const b=bindings[clip.role+':'+clip.text];assert(b);assert.equal(b.src,clip.src);assert.equal(b.voiceId,clip.voiceId);assert.equal(clip.voiceId===plan.instructionVoiceId,clip.role==='instruction');assert.equal(createHash('sha256').update(readFileSync('public'+clip.src)).digest('hex'),clip.sha256);}
});

test('the complete Dutch spelling scan has no unresolved flags',()=>{
 const check=json(folder+'spelling-check.json');assert.equal(check.language,'nl');assert.equal(check.fieldsChecked,2304);assert.equal(check.entriesChecked,288);assert.equal(check.reviewCompleted,true);assert.deepEqual(check.unresolved,[]);assert.deepEqual(check.reviewedFlags.map(x=>[x.word,x.decision]),[['klantenoverzicht','accepted']]);
});
