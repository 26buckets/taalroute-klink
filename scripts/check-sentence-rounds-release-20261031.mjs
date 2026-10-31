import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const git=(...a)=>execFileSync('git',a,{maxBuffer:128e6}),sha=b=>createHash('sha256').update(b).digest('hex');
const sort=a=>a.sort((a,b)=>a.localeCompare(b)),lines=b=>sort(b.toString().trim().split('\n').filter(Boolean));
const folder='docs/zinnen-a1-a2-20261031';
export function verifySentenceRoundsRelease(read=readFileSync){
 const r=JSON.parse(read('docs/klink-owner-release-sentence-rounds-20261031.json'));
 assert.equal(r.approvedBy,'Nico');assert.equal(r.publicationApproved,true);assert.equal(r.appearanceChanged,false);assert.equal(r.newAudioGenerated,false);
 assert.equal(r.userRequest,JSON.parse(read(folder+'/owner-request.json')).userRequest);
 assert.equal(r.baselineSourceCommit,'c5555f21c328a03a1d5db7e9c3b20e830f511ab3');assert.equal(r.liveSourceCommit,'f1133f7afed0e90ecdb04664ea6d4fde0d3aa253');
 git('merge-base','--is-ancestor',r.liveSourceCommit,r.baselineSourceCommit);git('merge-base','--is-ancestor',r.baselineSourceCommit,'HEAD');
 const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','next.config.ts','package.json','package-lock.json','wrangler.jsonc'];
 const changed=sort([...new Set([...lines(git('diff','--name-only',r.baselineSourceCommit,'--',...roots)),...lines(git('ls-files','--others','--exclude-standard','--',...roots))])]);
 const allowed=['data/klink-production-index.json','scripts/check-reading-rounds-release-20261031.mjs','scripts/check-sentence-rounds-release-20261031.mjs','scripts/test-production-content.mjs','scripts/test-reading-rounds-20261031.mjs','scripts/test-sentence-rounds-20261031.mjs','scripts/test-sentence-rounds-browser-20261031.mjs','scripts/test-sentence-rounds-release-20261031.mjs'];
 assert.deepEqual(changed,r.changedFiles);assert.deepEqual(sort(Object.keys(r.files)),changed);
 for(const f of changed){assert(allowed.includes(f)||/^public\/practice-content\/reading-rounds-20261031\/klink-zinnen-zelf-a[12]-20261031-r[12]-[a-f0-9]{16}\.json$/.test(f),f);assert.equal(sha(read(f)),r.files[f],f);}
 assert.equal(git('diff','--name-only',r.baselineSourceCommit,'--','app','components','hooks','lib','db','drizzle','.github').length,0,'Existing UI, routes, audio logic and storage stay exact');
 assert.equal(git('diff','--name-only','--diff-filter=MD',r.baselineSourceCommit,'--','public').length,0,'All existing media and public content stay exact');
 assert.equal(sha(read('docs/appearance-floor-20261031/floor.json')),sha(git('show',r.baselineSourceCommit+':docs/appearance-floor-20261031/floor.json')));
 const index=JSON.parse(read('data/klink-production-index.json')),prior=JSON.parse(git('show',r.baselineSourceCommit+':data/klink-production-index.json'));
 assert.deepEqual(index.slice(0,-4),prior);assert.deepEqual(index.slice(-4).map(x=>[x.level,x.help,x.count,x.activity]),[['a1','practice',12,'sentences'],['a2','practice',12,'sentences'],['a1','practice',10,'sentences'],['a2','practice',10,'sentences']]);
 assert.equal(sha(read(folder+'/source.json')),r.sourceSha256);
 const source=JSON.parse(read(folder+'/source.json')),sources=new Map(JSON.parse(read('data/klink-connected-content.json')).items.map(x=>[x.id,x])),ids=new Set();
 for(const[n,row]of index.slice(-4).entries()){
  const raw=read('public'+row.url),set=JSON.parse(raw),round=source.rounds[n];assert(row.url.endsWith(sha(raw).slice(0,16)+'.json'));assert.equal(set.id,row.id);assert.equal(set.exercises.length,row.count);
  for(const[i,e]of set.exercises.entries()){
   const q=round.questions[i],s=sources.get(q.sourceId);assert(s&&s.humanReview==='approved');assert.equal(s.text,q.sourceText);assert.equal(e.exerciseId,q.id);assert(!ids.has(e.exerciseId));ids.add(e.exerciseId);
   assert.deepEqual(e.sourceBlocks,[{id:q.sourceId,text:s.text,audio:s.blocks[0].audio}]);assert.equal(e.question,q.question);assert.equal(e.title,q.instruction);assert.deepEqual(e.options,q.options.map(o=>({id:o.id,label:o.text})));
   assert.equal(e.options.length,3);assert.deepEqual(e.answer.correctOptionIds,[q.correctOptionId]);assert.equal(e.options.find(o=>o.id===q.correctOptionId).label,q.correctAnswer);
   assert.equal(e.correctFeedback,q.feedback.correct);assert.equal(e.feedback,q.feedback.incorrect);assert.equal(e.readingRoundId,row.id);assert.equal(e.manualAdvance,true);assert.equal(e.requiresAudio,false);assert.equal(e.independentReading,false);assert.equal(e.reviewEligible,false);assert.equal(e.contextId,undefined);
  }
 }
 assert.equal(ids.size,44);
 const audio=JSON.parse(read(folder+'/audio-check.json'));assert.equal(audio.newAudioGenerated,false);assert.equal(audio.existingAudioChanged,false);assert.equal(audio.metadataChecked,true);assert.equal(audio.recordings.length,44);
 for(const a of audio.recordings){assert.equal(a.sha256,sha(read('public'+a.src)));assert.equal(a.tags.artist,'Taalroute');assert.equal(a.tags.album_artist,'Taalroute');assert(Number(a.duration)>0);}
 const player=JSON.parse(read(folder+'/player-check.json'));assert.equal(player.checks.length,32);assert.deepEqual(player.errors,[]);assert(player.localOnly);
 for(const c of player.checks){assert(c.audioPlayed>0);for(const k of ['wrongAnswersBlocked','correctFeedback','sourceVisible','reloadResume','completedReload','retry','oldProgressPreserved','backPreservesSelection'])assert.equal(c[k],true,k);}
 const appearance=JSON.parse(read(folder+'/appearance-check.json'));assert.equal(appearance.equal,true);assert.equal(appearance.checks.length,8);
 const offeredAudio=JSON.parse(read(folder+'/existing-audio-live.json'));assert.equal(offeredAudio.existingOfferedFilesByteIdentical,true);assert.equal(offeredAudio.checks.length,44);for(const a of offeredAudio.checks)assert.equal(a.sha256,sha(read('public'+a.src)));
 const menu=JSON.parse(read(folder+'/menu-check.json'));assert.deepEqual(menu.checks.map(c=>[c.level,c.rounds,c.questions,c.menuAccessible]),[['a1',2,22,true],['a2',2,22,true]]);
 const review=JSON.parse(read(folder+'/review.json'));for(const k of ['answers','audio','player','appearance','progress','preservation','types','lint','build','localOnly'])assert.equal(review[k],true,k);
 const backup=JSON.parse(read(folder+'/backup.json'));assert(backup.verified&&backup.driveId&&backup.sha256&&backup.downloadedByteIdentical&&backup.zipCrcVerified);for(const f of changed)assert.equal(backup.files[f],r.files[f],f);
 return r;
}
export function readBeforeSentenceRounds(file,r,read=readFileSync){return r.changedFiles.includes(file)?git('show',r.baselineSourceCommit+':'+file):read(file);}
