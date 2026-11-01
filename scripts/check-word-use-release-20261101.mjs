import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const base='9b5ca8c942d45dcf0988d3b893f55a23c069cca6',live='422894474e75ad18c3892263faa5c5c0486d6ca2',folder='docs/word-use-20261101/';
const git=(...a)=>execFileSync('git',a,{maxBuffer:128e6}),sha=b=>createHash('sha256').update(b).digest('hex'),sort=a=>a.sort((a,b)=>a.localeCompare(b)),lines=b=>b.toString().trim().split('\n').filter(Boolean);
const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','VORMGEVING-VASTGEZET.md','docs/appearance-floor-20261031','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','next.config.ts','package.json','package-lock.json','wrangler.jsonc'];
export function verifyWordUseRelease(read=readFileSync){
 const r=JSON.parse(read('docs/klink-owner-release-word-use-20261101.json'));
 assert.equal(r.approvedBy,'Nico');assert.equal(r.publicationApproved,true);assert.equal(r.appearanceUnchanged,true);assert.equal(r.provider,'ElevenLabs');assert.equal(r.baselineSourceCommit,base);assert.equal(r.liveSourceCommit,live);assert(r.userRequest.includes('Woordcombinaties en Welke reactie past?')&&r.userRequest.includes('zet ze online'));
 git('merge-base','--is-ancestor',live,base);git('merge-base','--is-ancestor',base,'HEAD');
 const changed=sort([...new Set([...lines(git('diff','--name-only',base,'--',...roots)),...lines(git('ls-files','--others','--exclude-standard','--',...roots))])]);
 assert.deepEqual(changed,r.changedFiles);assert.deepEqual(sort(Object.keys(r.files)),changed);for(const f of changed)assert.equal(sha(read(f)),r.files[f],f);
 assert.equal(git('diff','--name-only',base,'--','app','hooks','db','drizzle','.github','docs/appearance-floor-20261031','VORMGEVING-VASTGEZET.md','package.json','package-lock.json','vite.config.ts').length,0,'No change to appearance, workflows, storage or dependencies');
 const bank=JSON.parse(read('data/klink-word-use.json')),review=JSON.parse(read(folder+'content-review.json')),audio=JSON.parse(read(folder+'audio.json')),bindings=JSON.parse(read('data/klink-word-use-audio.json')),plan=JSON.parse(read(folder+'voice-plan.json'));
 assert.equal(bank.entries.length,288);assert.equal(review.bankSha256,sha(read('data/klink-word-use.json')));assert.equal(review.rows.length,288);assert.equal(review.editorialReview,'completed');assert.equal(review.independentHumanReview,false);assert.equal(review.classroomPilot,'open');
 assert.equal(plan.provider,'ElevenLabs');assert.equal(plan.instructionVoiceId,'h6uBOiAjLKklte8hdYio');assert.deepEqual(plan.targetVoiceIds,['0qLmDzgqulxcvv0yf3kg','7qdUFMklKPaaAVMsBTBt']);assert.equal(plan.model,'eleven_v4');assert.equal(audio.length,plan.clips.length);assert.equal(Object.keys(bindings).length,audio.length);
 for(const e of bank.entries){
  const checked=review.rows.find(x=>x.id===e.id);assert(checked?.allFourOptionsReviewed&&checked.uniqueCorrectAnswer&&checked.levelReason);for(const k of ['context','prompt','spokenPrompt','answer','options','explanation'])assert.deepEqual(e[k],checked[k]);
  assert.equal(e.options.length,4);assert.equal(new Set(e.options).size,4);assert.equal(e.options.filter(x=>x===e.answer).length,1);assert(e.id.includes(':recall:'));
  const uses=plan.uses[e.id];assert(uses);assert.equal(bindings[uses.prompt].transcript,e.spokenPrompt);for(const label of e.options)assert.equal(bindings[uses.options[label]].transcript,label);
 }
 for(const activity of ['word-combinations','suitable-reply'])for(const level of ['a1','a2','b1'])assert.equal(bank.entries.filter(e=>e.activity===activity&&e.level===level).length,48);
 const previous=new Set(lines(git('ls-tree','-r','--name-only',base,'--','public')));
 for(const c of audio){
  const p=plan.clips.find(x=>x.id===c.id),b=bindings[c.role+':'+c.text];assert(p&&b);for(const k of ['src','role','voiceId'])assert.equal(b[k],c[k]);assert.equal(b.transcript,c.text);assert.equal(b.review,'approved');assert.equal(b.metadataApproved,true);assert.equal(b.humanReview,'open');
  assert.equal(sha(read('public'+c.src)),c.sha256);assert(c.metadataVerified);for(const k of ['artist','album_artist','publisher'])assert.equal(c.metadata[k],'Taalroute');assert(!/elevenlabs|suno|openai|generator/i.test(JSON.stringify(c.metadata)));
  assert.equal(c.voiceId===plan.instructionVoiceId,c.role==='instruction');if(!c.reused){assert(c.audioPacketsUnchanged&&c.audioPacketsSha256&&c.originalSha256);assert(!previous.has('public'+c.src));}else assert(previous.has('public'+c.src));
 }
 for(const f of changed.filter(x=>x.startsWith('public/')))assert(audio.some(c=>'public'+c.src===f&&!c.reused),'Only active new audio is published: '+f);
 const questions=JSON.parse(read(folder+'local/browser-checks.json')),playback=JSON.parse(read(folder+'local/audio-browser-checks.json')),layouts=JSON.parse(read(folder+'final-layout/checks.json')),preserved=JSON.parse(read(folder+'preserved/checks.json'));
 assert.equal(questions.checks.length,576);assert.equal(questions.layouts.length,72);assert.deepEqual(questions.errors,[]);
 assert.equal(playback.native.length,12);assert.equal(playback.decoded.length,2);assert(playback.native.every(x=>x.clips.length===6&&x.clips.every(c=>c.ended)));assert(playback.decoded.every(x=>x.clips.length===audio.length));assert.deepEqual(playback.errors,[]);
 assert.equal(layouts.checks.length,84);assert(layouts.checks.filter(x=>x.width>=390).every(x=>x.stageOverflow<=2));assert.equal(preserved.checks.length,8);assert(preserved.checks.every(x=>x.pixelIdentical));
 const compiled=JSON.parse(read(folder+'worker-preview-checks.json'));assert.equal(compiled.checks.length,12);assert(compiled.checks.every(x=>x.compiledPlayer&&x.fourCards&&x.correctFeedback&&x.resume));
 const checks=JSON.parse(read(folder+'verification.json'));for(const k of ['types','lint','unit','build','all288Questions','fourAnswerCards','audioComplete','metadataVerified','nativePlayback','desktopAndMobile','keyboardAndTouch','reviewAndResume','previousContentPreserved','localOnly'])assert.equal(checks[k],true,k);
 const backup=JSON.parse(read(folder+'backup.json'));assert(backup.verified&&backup.fullReadback&&backup.zipIntegrity&&backup.driveId&&backup.sha256);assert.deepEqual(backup.files,r.files);assert.equal(backup.restoredSourceVerified,true);assert(backup.parts.length>=2&&backup.parts.every(p=>p.verified&&p.fullReadback&&p.zipIntegrity&&p.driveId&&p.sha256&&p.bytes<104857600));
 return r;
}
export function readBeforeWordUse(file,r,read=readFileSync){return r.changedFiles.includes(file)?git('show',base+':'+file):read(file);}
