import {verifySentenceRoundsRelease,readBeforeSentenceRounds} from './check-sentence-rounds-release-20261031.mjs';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const git=(...args)=>execFileSync('git',args,{maxBuffer:128e6}),sha=b=>createHash('sha256').update(b).digest('hex');
const sort=xs=>xs.sort((a,b)=>a.localeCompare(b)),lines=b=>sort(b.toString().trim().split('\n').filter(Boolean));
const evidence='docs/leesrondes-a1-a2-20261031';
export function verifyReadingRoundsRelease(read=readFileSync){
 const successor=verifySentenceRoundsRelease(read),currentRead=read;read=file=>readBeforeSentenceRounds(file,successor,currentRead);
 const r=JSON.parse(read('docs/klink-owner-release-reading-rounds-20261031.json'));
 assert.equal(r.approvedBy,'Nico');assert.equal(r.publicationApproved,true);assert.equal(r.appearanceChanged,false);assert.equal(r.newAudioGenerated,false);
 assert.equal(r.userRequest,JSON.parse(read(evidence+'/owner-request.json')).userRequest);
 assert.equal(r.baselineSourceCommit,'bd246ef9ded72364acb0a4c6d60a9137d1446698');assert.equal(r.liveSourceCommit,r.baselineSourceCommit);
 git('merge-base','--is-ancestor',r.liveSourceCommit,'HEAD');
 const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','next.config.ts','package.json','package-lock.json','wrangler.jsonc'];
 const changed=lines(git('diff','--name-only',r.baselineSourceCommit,successor.baselineSourceCommit,'--',...roots));
 const allowed=['components/product/extended-practice-surface.tsx','data/klink-production-index.json','scripts/check-motion-release-20261031.mjs','scripts/check-reading-rounds-release-20261031.mjs','scripts/test-reading-rounds-20261031.mjs','scripts/test-reading-rounds-browser-20261031.mjs','scripts/test-reading-rounds-appearance-20261031.mjs','scripts/test-reading-rounds-release-20261031.mjs','scripts/test-practice-chapters.mjs','scripts/test-production-content.mjs','scripts/test-existing-player-curriculum.mjs'];
 assert.deepEqual(changed,r.changedFiles);assert.deepEqual(sort(Object.keys(r.files)),changed);
 for(const f of changed){assert(allowed.includes(f)||/^public\/practice-content\/reading-rounds-20261031\/a[12]-r01-[a-f0-9]{16}\.json$/.test(f),f);assert.equal(sha(read(f)),r.files[f],f);}
 assert.equal(git('diff','--name-only',r.baselineSourceCommit,successor.baselineSourceCommit,'--','app','hooks','lib','db','drizzle','.github').length,0,'Appearance, existing content logic and persistence stay exact');
 assert.equal(git('diff','--name-only','--diff-filter=MD',r.baselineSourceCommit,successor.baselineSourceCommit,'--','public').length,0,'Existing media and content assets stay exact');
 assert.equal(sha(read('docs/appearance-floor-20261031/floor.json')),sha(git('show',r.baselineSourceCommit+':docs/appearance-floor-20261031/floor.json')),'Appearance approval is not rewritten');
 const surface='components/product/extended-practice-surface.tsx';
 assert.equal(read(surface).toString().replace('const feedback = synonyms || exercise.readingRoundId ?', 'const feedback = synonyms ?'),git('show',r.baselineSourceCommit+':'+surface).toString(),'Only reviewed round feedback changes; all JSX and existing behavior retained');
 const prior=JSON.parse(git('show',r.baselineSourceCommit+':data/klink-production-index.json')),index=JSON.parse(read('data/klink-production-index.json'));
 assert.deepEqual(index.slice(0,-2),prior);assert.deepEqual(index.slice(-2).map(x=>[x.level,x.help,x.count]),[['a1','practice',12],['a2','practice',12]]);
 assert.equal(sha(read(evidence+'/source.json')),r.sourceSha256);
 const source=JSON.parse(read(evidence+'/source.json')),ids=new Set();
 for(const row of index.slice(-2)){
  assert(!prior.some(x=>x.id===row.id));const raw=read('public'+row.url),set=JSON.parse(raw);assert(row.url.endsWith(sha(raw).slice(0,16)+'.json'));assert.equal(set.id,row.id);assert.equal(set.exercises.length,12);
  const texts=source.texts.filter(t=>t.level.toLowerCase()===row.level);
  for(const[i,e]of set.exercises.entries()){
   assert(!ids.has(e.exerciseId));ids.add(e.exerciseId);const t=texts[Math.floor(i/4)],q=t.questions[i%4];
   assert.equal(e.sourceText,t.text);assert.equal(e.sourceBlocks[0].text,t.text);assert.equal(e.question,q.prompt);assert.deepEqual(e.options.map(x=>x.label),q.options);assert.deepEqual(e.answer.correctOptionIds,[q.answer]);assert.equal(e.sourceEvidence,q.evidence);assert(t.text.includes(e.sourceEvidence));
   assert.equal(e.correctFeedback,q.correctFeedback);assert.equal(e.feedback,q.retryFeedback);assert.equal(e.manualAdvance,true);assert.equal(e.requiresAudio,false);assert.equal(e.independentReading,false);assert.equal(e.reviewEligible,false);
   assert(!/"(?:audio|instructionAudio|questionAudio|feedbackAudio|src)"\s*:/.test(JSON.stringify(e)),'No unverified audio');
  }
 }
 assert.equal(ids.size,24);
 const audio=JSON.parse(read(evidence+'/audio-check.json'));assert.equal(audio.audioAttached,0);assert.equal(audio.newAudioGenerated,false);assert.equal(audio.existingAudioChanged,false);assert(Object.values(audio.exactTextMatches).every(x=>x.length===0));
 const review=JSON.parse(read(evidence+'/review.json'));for(const k of ['answers','audio','player','appearance','progress','preservation','types','lint','build','localOnly'])assert.equal(review[k],true,k);
 const player=JSON.parse(read(evidence+'/player-check.json'));assert.equal(player.checks.length,24);assert.deepEqual(player.errors,[]);for(const c of player.checks)for(const k of ['wrongAnswersBlocked','correctFeedback','sourceVisible','reloadResume','completedReload','retry','oldProgressPreserved'])assert.equal(c[k],true,k);
 const appearance=JSON.parse(read(evidence+'/appearance-check.json'));assert(appearance.checks.length>=8);assert(appearance.equal);
 const backup=JSON.parse(read(evidence+'/backup.json'));assert(backup.verified&&backup.driveId&&backup.sha256&&backup.downloadedByteIdentical&&backup.zipCrcVerified);for(const f of changed)assert.equal(backup.files[f],r.files[f],f);
 return {...r,successor};
}
export function readBeforeReadingRounds(file,r,read=readFileSync){return r.changedFiles.includes(file)?git('show',r.baselineSourceCommit+':'+file):readBeforeSentenceRounds(file,r.successor,read);}
