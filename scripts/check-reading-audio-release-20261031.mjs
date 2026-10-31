import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const git=(...args)=>execFileSync('git',args,{maxBuffer:128e6}),sha=b=>createHash('sha256').update(b).digest('hex');
const sort=xs=>xs.sort((a,b)=>a.localeCompare(b)),lines=b=>sort(b.toString().trim().split('\n').filter(Boolean));
const base='b4df210793db0a5bf9b6bb1a8aecc3a9ee4352c6',folder='docs/leesrondes-audio-20261031';
const before=file=>git('show',base+':'+file),json=(file,read)=>JSON.parse(read(file));
export function verifyReadingAudioContent(read=readFileSync){
 const indexFile='data/klink-production-index.json',aliasFile='data/klink-progress-image-aliases-20261030.json';
 const prior=json(indexFile,before),index=json(indexFile,read),oldAliases=json(aliasFile,before),aliases=json(aliasFile,read);
 const plan=json(folder+'/voice-plan.json',read),record=json(folder+'/recordings.json',read),textCheck=json(folder+'/text-check.json',read);
 assert.equal(plan.items.length,6);assert.equal(record.recordings.length,6);assert.equal(record.male,3);assert.equal(record.female,3);
 assert.equal(plan.items.filter(i=>i.gender==='female').length,3);assert.equal(plan.items.filter(i=>i.gender==='male').length,3);
 assert(plan.items.every(i=>i.role==='external-narrator'&&i.voiceId!==plan.instructionVoiceId));
 assert.equal(textCheck.passed,true);assert.equal(textCheck.recordings.length,6);assert(textCheck.recordings.every(i=>i.normalizedTextEqual));assert.equal(textCheck.timesVerified,true);
 assert.equal(sha(read('docs/leesrondes-a1-a2-20261031/source.json')),sha(before('docs/leesrondes-a1-a2-20261031/source.json')));
 const rows=index.filter(r=>r.id.startsWith('klink-teksten-zelf-')),updated=new Map(rows.map(r=>[r.id,r]));assert.equal(rows.length,2);
 assert.deepEqual(index,prior.map(r=>updated.has(r.id)?{...r,url:updated.get(r.id).url}:r),'Only the two reading content URLs may change');
 const expectedAliases={...oldAliases};
 for(const row of rows){
  const previous=prior.find(p=>p.id===row.id),raw=read('public'+row.url),current=JSON.parse(raw),old=json('public'+previous.url,read);
  assert.notEqual(row.url,previous.url);assert(row.url.endsWith(sha(raw).slice(0,16)+'.json'));
  expectedAliases[row.url]=oldAliases[previous.url]??previous.url;
  assert.equal(current.exercises.length,12);
  const stripped=structuredClone(current);
  for(const [n,e]of current.exercises.entries()){
   const original=old.exercises[n],item=plan.items.find(i=>i.id===original.sourceBlocks[0].id);assert(item);
   assert.deepEqual(e.sourceBlocks[0].audio,{audioId:'KLINK-READ-'+item.id,src:item.src});
   delete stripped.exercises[n].sourceBlocks[0].audio;
  }
  assert.deepEqual(stripped,old,'All source text, questions, answers, feedback, IDs and behavior flags stay exact');
 }
 assert.deepEqual(aliases,expectedAliases,'Every existing progress mapping is preserved; new URLs point to the original keys');
 for(const item of plan.items){
  const r=record.recordings.find(r=>r.id===item.id);assert(r);for(const field of ['voiceId','gender','text','role','src'])assert.equal(r[field],item[field]);
  assert.equal(r.sha256,sha(read('public'+item.src)));assert.equal(textCheck.recordings.find(t=>t.id===item.id)?.sha256,r.sha256);
  const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-show_format','-show_streams','-of','json','public'+item.src]));
  assert.deepEqual(probe.format.tags,r.metadata);for(const field of ['artist','album_artist','publisher'])assert.equal(probe.format.tags[field],'Taalroute');
  assert.equal(probe.format.tags.album,'Klink - Taalroute');assert(!/eleven|suno|openai|generator|text.to.speech/i.test(JSON.stringify(probe.format.tags)));
  assert.equal(probe.streams.length,1);assert.equal(probe.streams[0].codec_name,'pcm_s16le');assert(Number(probe.format.duration)>5&&Number(probe.format.duration)<60);
  const pcm=execFileSync('ffmpeg',['-v','error','-i','public'+item.src,'-map','0:a:0','-f','s16le','-acodec','pcm_s16le','pipe:1'],{maxBuffer:16e6});
  assert.equal(sha(pcm),r.pcmSha256);assert.equal(r.decodedAudioIdentical,true);assert.equal(r.clippedSamples,0);
 }
 return {rows,recordings:record.recordings};
}
export function verifyReadingAudioRelease(read=readFileSync){
 const r=json('docs/klink-owner-release-reading-audio-20261031.json',read);
 assert.equal(r.approvedBy,'Nico');assert.equal(r.publicationApproved,true);assert.equal(r.appearanceChanged,false);assert.equal(r.newAudioGenerated,true);
 assert.equal(r.baselineSourceCommit,base);assert.equal(r.liveSourceCommit,base);git('merge-base','--is-ancestor',base,'HEAD');
 assert.equal(r.userRequest,json(folder+'/owner-request.json',read).userRequest);
 const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','next.config.ts','package.json','package-lock.json','wrangler.jsonc'];
 const changed=sort([...new Set([...lines(git('diff','--name-only',base,'--',...roots)),...lines(git('ls-files','--others','--exclude-standard','--',...roots))])]);
 const allowed=['data/klink-production-index.json','data/klink-progress-image-aliases-20261030.json','scripts/check-sentence-rounds-release-20261031.mjs','scripts/check-reading-audio-release-20261031.mjs','scripts/test-reading-rounds-20261031.mjs','scripts/test-reading-rounds-browser-20261031.mjs','scripts/test-reading-rounds-appearance-20261031.mjs','scripts/test-sentence-rounds-20261031.mjs','scripts/test-reading-audio-20261031.mjs','scripts/test-reading-audio-progress-browser-20261031.mjs','scripts/test-reading-audio-release-20261031.mjs'];
 assert.deepEqual(changed,r.changedFiles);assert.deepEqual(sort(Object.keys(r.files)),changed);
 for(const file of changed){assert(allowed.includes(file)||/^public\/practice-content\/reading-rounds-20261031\/a[12]-r01-[a-f0-9]{16}\.json$/.test(file)||/^public\/package-audio\/reading-rounds-20261031\/a[12]-t0[123]\.wav$/.test(file),file);assert.equal(sha(read(file)),r.files[file],file);}
 assert.equal(git('diff','--name-only',base,'--','app','components','hooks','lib','db','drizzle','.github','package.json','package-lock.json','vite.config.ts').length,0,'All UI, playback logic, routes, storage and deployment configuration stay exact');
 assert.equal(git('diff','--name-only','--diff-filter=MD',base,'--','public').length,0,'All previously published media and content files remain exact');
 assert.equal(sha(read('docs/appearance-floor-20261031/floor.json')),sha(before('docs/appearance-floor-20261031/floor.json')));
 const content=verifyReadingAudioContent(read);for(const f of ['voice-plan.json','recordings.json','text-check.json'])assert.equal(sha(read(folder+'/'+f)),r.evidenceSha256[f]);
 const player=json(folder+'/player-check.json',read);assert(player.localOnly);assert(player.checks.length>=8);assert.deepEqual(player.errors,[]);assert(player.checks.every(c=>c.allThreeRecordingsPlayed&&c.oldProgressPreserved&&c.reloadResume&&c.completedReload));assert.equal(player.checks.filter(c=>c.completedNativePlayback).length,2);
 const progress=json(folder+'/progress-check.json',read);assert.equal(progress.checks.length,8);assert(progress.checks.every(c=>c.oldKeysRetained&&c.originalCompletionRetained&&c.sessionRestored));
 const appearance=json(folder+'/appearance-check.json',read);assert(appearance.equal&&appearance.checks.length===8);
 const review=json(folder+'/review.json',read);for(const k of ['text','metadata','lossless','player','appearance','progress','preservation','types','lint','build','localOnly'])assert.equal(review[k],true,k);
 const backup=json(folder+'/backup.json',read);assert(backup.verified&&backup.driveId&&backup.downloadedByteIdentical&&backup.zipCrcVerified);for(const file of changed)assert.equal(backup.files[file],r.files[file],file);for(const a of content.recordings)assert.equal(backup.originals[a.id],a.originalSha256);
 return r;
}
export function readBeforeReadingAudio(file,r,read=readFileSync){return r.changedFiles.includes(file)?before(file):read(file);}
