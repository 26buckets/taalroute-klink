import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const base='87a3a2ba3854f2fe11e1255f29ebf5d0017d042a',folder='docs/synonym-recovery-20261101';
const git=(...args)=>execFileSync('git',args,{maxBuffer:128e6});
const sha=b=>createHash('sha256').update(b).digest('hex');
const lines=b=>b.toString().trim().split('\n').filter(Boolean);
const sort=a=>a.sort((a,b)=>a.localeCompare(b));
const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','next.config.ts','package.json','package-lock.json','wrangler.jsonc'];
export const recoveryFiles=[
 'data/klink-synonyms.json','data/klink-synonym-audio.json','public/package-audio/synoniemen-aanvulling-20261101/SR001.mp3',
 'scripts/check-exercise-view-release-20261101.mjs','scripts/check-synonym-recovery-release-20261101.mjs',
 'scripts/test-synonyms.mjs','scripts/test-synonyms-release-20261030.mjs','scripts/test-synonyms-browser.mjs','scripts/test-synonym-modes-browser.mjs',
 'scripts/test-synonym-recovery-20261101.mjs','scripts/test-synonym-recovery-browser-20261101.mjs',
];
export function verifySynonymRecoveryRelease(read=readFileSync){
 const r=JSON.parse(read('docs/klink-owner-release-synonym-recovery-20261101.json'));
 assert.equal(r.approvedBy,'Nico');assert.equal(r.publicationApproved,true);assert.equal(r.appearanceChanged,false);
 assert.equal(r.baselineSourceCommit,base);assert.equal(r.liveSourceCommit,base);
 assert.equal(r.userRequest,'Waarom staan die 15 opnamen in het archief? Kijk welke je kunt koppelen aan goede synoniemenopdrachten voor A1, A2 en B1 en zet die ook beschikbaar in Klink.');
 git('merge-base','--is-ancestor',base,'HEAD');
 const changed=sort([...new Set([...lines(git('diff','--name-only',base,'--',...roots)),...lines(git('ls-files','--others','--exclude-standard','--',...roots))])]);
 assert.deepEqual(changed,sort([...recoveryFiles]));assert.deepEqual(r.changedFiles,changed);assert.deepEqual(sort(Object.keys(r.files)),changed);
 for(const f of changed)assert.equal(sha(read(f)),r.files[f],f);
 const before=JSON.parse(git('show',base+':data/klink-synonyms.json')),bank=JSON.parse(read('data/klink-synonyms.json'));
 assert.deepEqual({...bank,entries:before.entries},before);assert.deepEqual(bank.entries.slice(0,210),before.entries,'Every original question, archival decision and identifier is preserved');
 assert.equal(bank.entries.length,217);assert.equal(bank.entries.filter(x=>x.active).length,192);
 const added=bank.entries.slice(210),review=JSON.parse(read(folder+'/word-review.json'));
 assert.equal(review.recovered.length,7);assert.equal(review.retained.length,8);assert.equal(new Set([...review.recovered.map(x=>x.recordingWord),...review.retained.map(x=>x.word)]).size,15);
 for(const e of added){
  assert.equal(e.active,true);assert.equal(e.minimumLevel,'b1');assert.deepEqual(e.levels,['b1']);
  assert.equal(e.options.length,4);assert.equal(new Set(e.options).size,4);assert.equal(e.options.filter(x=>x===e.synonym).length,1);assert(!e.options.includes(e.word));assert([e.word,...e.options].every(x=>!/[\s]/.test(x)));
  assert.equal(e.review.individualCefrValidated,false);assert.equal(e.review.independentHumanReview,false);
  const audit=review.recovered.find(x=>x.newId===e.id);assert(audit&&audit.allFourOptionsReviewed&&audit.bothDirectionsReviewed&&audit.sense&&audit.levelReason&&audit.sourceUrl);assert.deepEqual(audit.newPair,[e.word,e.synonym]);assert.deepEqual(audit.options,e.options);
  assert(before.entries.some(x=>x.id===audit.archivedId&&!x.active));
 }
 for(const [level,n]of [['a1',16],['a2',59],['b1',192]])assert.equal(bank.entries.filter(e=>e.active&&e.levels.includes(level)).length,n);
 const oldAudio=JSON.parse(git('show',base+':data/klink-synonym-audio.json')),bindings=JSON.parse(read('data/klink-synonym-audio.json'));
 for(const[k,v]of Object.entries(oldAudio))assert.deepEqual(bindings[k],v);assert.deepEqual(Object.keys(bindings).filter(k=>!(k in oldAudio)),['synonym-word:bestedingen']);
 const audio=JSON.parse(read(folder+'/audio.json')),plan=JSON.parse(read(folder+'/voice-plan.json')),binding=bindings['synonym-word:bestedingen'];
 assert.equal(audio.provider,'ElevenLabs');assert.equal(audio.text,'bestedingen');assert.equal(audio.role,'target');assert.equal(audio.voiceId,'7qdUFMklKPaaAVMsBTBt');assert.equal(audio.voiceId,plan.newRecordings[0].voiceId);assert.notEqual(audio.voiceId,plan.instructionVoiceId);assert.equal(audio.humanListeningReview,'open');assert(audio.audioPacketsUnchanged&&audio.metadataVerified);assert.equal(sha(read('public'+audio.src)),audio.sha256);
 assert.equal(binding.src,audio.src);assert.equal(binding.transcript,audio.text);assert.equal(binding.voiceId,audio.voiceId);assert.equal(binding.role,'target');assert.equal(binding.review,'approved');assert.equal(binding.metadataApproved,true);assert.equal(binding.humanReview,'open');
 const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','format_tags','-of','json','public'+audio.src]));
 for(const key of ['artist','album_artist','publisher'])assert.equal(probe.format.tags[key],'Taalroute');assert.equal(probe.format.tags.album,'Klink - Synoniemen');assert.equal(probe.format.tags.title,'bestedingen');assert(!/elevenlabs|suno|openai|generator/i.test(JSON.stringify(probe.format.tags)));
 const previousPublic=new Set(lines(git('ls-tree','-r','--name-only',base,'--','public')));for(const f of changed.filter(f=>f.startsWith('public/')))assert(!previousPublic.has(f),'Existing media remain byte-identical');
 const originalClips=JSON.parse(read('docs/synonyms-20261030/audio.json'));for(const c of originalClips)assert.equal(sha(read('public'+c.src)),c.sha256);
 const used=new Set(bank.entries.filter(e=>e.active).flatMap(e=>[e.word,e.synonym]));assert.equal(originalClips.filter(c=>used.has(c.word)).length,60);
 assert.equal(read('docs/appearance-floor-20261031/floor.json').toString(),git('show',base+':docs/appearance-floor-20261031/floor.json').toString());
 const checks=JSON.parse(read(folder+'/verification.json'));for(const key of ['types','lint','build','unit','allNewPairs','threeModes','reverseDirections','nativePlayback','appearancePreserved','previousContentPreserved','localOnly'])assert.equal(checks[key],true,key);
 const backup=JSON.parse(read(folder+'/backup.json'));assert(backup.verified&&backup.fullReadback&&backup.zipIntegrity&&backup.driveId&&backup.sha256);assert.deepEqual(backup.files,r.files);
 return r;
}
export function readBeforeSynonymRecovery(file,r,read=readFileSync){return r.changedFiles.includes(file)?git('show',base+':'+file):read(file);}
