import {verifyDialogueMobilePhotoRelease,readBeforeDialogueMobilePhoto} from './check-dialogue-mobile-photo-release-20261101.mjs';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const base='9b4e0937dcad82e14e25ebc97e8a4b08b244042f',live='dd3e3528b57ed9edcee4f99361dddbe3ab43da71',folder='docs/synonym-context-20261101';
const git=(...args)=>execFileSync('git',args,{maxBuffer:128e6}),sha=b=>createHash('sha256').update(b).digest('hex');
const lines=b=>b.toString().trim().split('\n').filter(Boolean),sort=a=>a.sort((a,b)=>a.localeCompare(b));
const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','next.config.ts','package.json','package-lock.json','wrangler.jsonc','VORMGEVING-VASTGEZET.md'];
export const contextFiles=['VORMGEVING-VASTGEZET.md','app/learner-ui.css','components/product/extended-practice-surface.tsx','components/product/package-exercise-browser.tsx','components/product/package-group-practice.tsx','data/klink-synonyms.json','data/klink-synonym-audio.json','lib/synonyms.ts','scripts/test-synonyms.mjs','scripts/test-synonyms-browser.mjs','scripts/test-synonym-recovery-20261101.mjs','scripts/check-sentence-listen-repair-release-20261101.mjs','scripts/check-synonym-context-release-20261101.mjs','scripts/test-synonym-context-20261101.mjs','scripts/test-synonym-context-browser-20261101.mjs',...[1,2,3].map(i=>`public/package-audio/synoniemen-context-20261101/SC00${i}.mp3`)];
export function verifySynonymContextRelease(read=readFileSync){
 const successor=verifyDialogueMobilePhotoRelease(read),readCurrent=read;read=file=>readBeforeDialogueMobilePhoto(file,successor,readCurrent);
 const r=JSON.parse(read('docs/klink-owner-release-synonym-context-20261101.json'));
 assert.equal(r.approvedBy,'Nico');assert.equal(r.publicationApproved,true);assert.equal(r.appearanceChangeApproved,true);assert.equal(r.baselineSourceCommit,base);assert.equal(r.liveSourceCommit,live);assert.equal(r.provider,'ElevenLabs');
 assert(r.userRequest.includes('acht overgebleven opnamen')&&r.userRequest.includes('bovenaan')&&r.userRequest.includes('scrollen'));
 git('merge-base','--is-ancestor',live,base);git('merge-base','--is-ancestor',base,'HEAD');
 const changed=sort(lines(git('diff','--name-only',base,successor.baselineSourceCommit,'--',...roots)));
 assert.deepEqual(changed,sort([...contextFiles]));assert.deepEqual(r.changedFiles,changed);assert.deepEqual(sort(Object.keys(r.files)),changed);for(const f of changed)assert.equal(sha(read(f)),r.files[f],f);
 const before=JSON.parse(git('show',base+':data/klink-synonyms.json')),bank=JSON.parse(read('data/klink-synonyms.json'));
 assert.deepEqual({...bank,entries:before.entries},before);assert.deepEqual(bank.entries.slice(0,217),before.entries);assert.equal(bank.entries.length,225);assert.equal(bank.entries.filter(e=>e.active).length,200);
 const review=JSON.parse(read(folder+'/word-review.json'));assert.equal(review.rows.length,8);assert.equal(new Set(review.rows.map(x=>x.word)).size,8);
 for(const e of bank.entries.slice(217)){
  const a=review.rows.find(x=>x.id===e.id);assert(a&&a.allFourOptionsReviewed&&a.bothDirectionsReviewed&&a.sense&&a.levelReason&&a.sourceUrl);assert.equal(e.active,true);assert.equal(e.minimumLevel,'b1');assert.deepEqual(e.levels,['b1']);assert.equal(e.collectionId,'synonyms-b1-context-20261101');
  assert.equal(e.context,a.context);assert.equal(e.reverseContext,a.reverseContext);assert(e.context.includes(e.word)&&e.reverseContext.includes(e.synonym));assert(e.context.split(' ').length<=12&&e.reverseContext.split(' ').length<=12);
  assert.deepEqual(e.options,a.options);assert.equal(new Set(e.options).size,4);assert.equal(e.options.filter(x=>x===e.synonym).length,1);assert(!e.options.includes(e.word));assert.equal(e.review.individualCefrValidated,false);assert.equal(e.review.independentHumanReview,false);
  assert(before.entries.some(x=>x.id===a.archivedId&&!x.active));
 }
 for(const[level,n]of [['a1',16],['a2',59],['b1',200]])assert.equal(bank.entries.filter(e=>e.active&&e.levels.includes(level)).length,n);
 const oldAudio=JSON.parse(git('show',base+':data/klink-synonym-audio.json')),bindings=JSON.parse(read('data/klink-synonym-audio.json')),clips=JSON.parse(read(folder+'/audio.json')),plan=JSON.parse(read(folder+'/voice-plan.json'));
 for(const[k,v]of Object.entries(oldAudio))assert.deepEqual(bindings[k],v);assert.equal(clips.length,3);assert.deepEqual(Object.keys(bindings).filter(k=>!(k in oldAudio)),clips.map(c=>'synonym-word:'+c.text));
 assert.deepEqual(clips.map(c=>c.voiceId),['0qLmDzgqulxcvv0yf3kg','7qdUFMklKPaaAVMsBTBt','0qLmDzgqulxcvv0yf3kg']);
 for(const c of clips){assert.equal(c.provider,'ElevenLabs');assert.equal(c.text,plan.newRecordings.find(x=>x.id===c.id).text);assert.notEqual(c.voiceId,plan.instructionVoiceId);assert(c.audioPacketsUnchanged&&c.metadataVerified);assert.equal(c.humanListeningReview,'open');assert.equal(sha(read('public'+c.src)),c.sha256);
  const tags=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','format_tags','-of','json','public'+c.src])).format.tags;for(const k of ['artist','album_artist','publisher'])assert.equal(tags[k],'Taalroute');assert.equal(tags.album,'Klink - Synoniemen');assert.equal(tags.title,c.text);assert(!/elevenlabs|suno|openai|generator/i.test(JSON.stringify(tags)));
  const b=bindings['synonym-word:'+c.text];assert.equal(b.src,c.src);assert.equal(b.transcript,c.text);assert.equal(b.voiceId,c.voiceId);assert.equal(b.role,'target');assert.equal(b.review,'approved');assert.equal(b.metadataApproved,true);assert.equal(b.humanReview,'open');
 }
 const previousPublic=new Set(lines(git('ls-tree','-r','--name-only',base,'--','public')));for(const f of changed.filter(f=>f.startsWith('public/')))assert(!previousPublic.has(f),'No existing recording may be changed');
 const used=new Set(bank.entries.filter(e=>e.active).flatMap(e=>[e.word,e.synonym]));for(const c of JSON.parse(read('docs/synonyms-20261030/audio.json'))){assert(used.has(c.word));assert.equal(sha(read('public'+c.src)),c.sha256);}
 const floor=JSON.parse(read('docs/appearance-floor-20261031/floor.json')),oldFloor=JSON.parse(git('show',base+':docs/appearance-floor-20261031/floor.json'));assert.deepEqual({...floor,approvedUpdates:oldFloor.approvedUpdates},oldFloor);assert.deepEqual(floor.approvedUpdates,[...oldFloor.approvedUpdates,r.approval]);
 const approval=JSON.parse(read(r.approval));assert.equal(approval.userRequest,r.userRequest);assert.deepEqual(approval.files,r.files);assert.equal(approval.requestedLayoutSha256,sha(read(folder+'/requested-layout.png')));
 const checks=JSON.parse(read(folder+'/verification.json'));for(const k of ['types','lint','build','unit','allEightContexts','threeModes','reverseDirections','nativePlayback','controlsAtTop','noScrollDesktop','noScrollMobile','previousContentPreserved','localOnly'])assert.equal(checks[k],true,k);
 const backup=JSON.parse(read(folder+'/backup.json'));assert(backup.verified&&backup.fullReadback&&backup.zipIntegrity&&backup.driveId&&backup.sha256);assert.deepEqual(backup.files,r.files);
 return {...r,successor};
}
export function readBeforeSynonymContext(file,r,read=readFileSync){return r.changedFiles.includes(file)||file==='docs/appearance-floor-20261031/floor.json'?git('show',base+':'+file):readBeforeDialogueMobilePhoto(file,r.successor,read);}
