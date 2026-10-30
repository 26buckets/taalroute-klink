import assert from 'node:assert/strict';
import {verifySmallWordRoundsRelease,readBeforeSmallWordRounds} from './check-small-word-rounds-release.mjs';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const git=(...args)=>execFileSync('git',args,{maxBuffer:128e6});
const sha=b=>createHash('sha256').update(b).digest('hex');
const compare=(a,b)=>a.localeCompare(b);
const lines=b=>b.toString().trim().split('\n').filter(Boolean).sort(compare);
const dir='docs/sentence-publication-20261030/';
export function verifySentenceRelease(read=readFileSync){
 const successor=verifySmallWordRoundsRelease(read),currentRead=read;read=file=>readBeforeSmallWordRounds(file,successor,currentRead);
 const r=JSON.parse(read('docs/klink-owner-release-sentences-20261030.json'));
 const owner=JSON.parse(read(dir+'owner-request.json'));
 assert.equal(r.approvedBy,'Nico');assert.equal(r.publicationApproved,true);
 assert.equal(owner.answer,'Publiceer na automatische controles');assert.equal(owner.publicationApproved,true);
 assert.equal(r.baselineSourceCommit,'8b2978dec51ee1ecb3a045144a82fcaa93308ac8');
 assert.equal(r.liveSourceCommit,'b96c60d46bbb7609de7f1612e5d9ecfa391ea776');
 git('merge-base','--is-ancestor',r.liveSourceCommit,r.baselineSourceCommit);
 git('merge-base','--is-ancestor',r.baselineSourceCommit,'HEAD');
 const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','package.json','package-lock.json','wrangler.jsonc'];
 const changed=lines(git('diff','--name-only',r.baselineSourceCommit,successor.baselineSourceCommit,'--',...roots));
 const allowed=["data/klink-connected-content.json", "data/klink-content-routing.json", "data/klink-sentence-levels.json", "lib/connected-content.ts", "lib/content-levels.ts", "lib/learner-route.ts", "lib/practice-chapters.ts", "public/content-register/active.json", "public/package-audio/zinsherstel-20261030/zin-01.mp3", "public/package-audio/zinsherstel-20261030/zin-04.mp3", "public/package-audio/zinsherstel-20261030/zin-09.mp3", "public/package-audio/zinsherstel-20261030/zin-19.mp3", "public/package-audio/zinsherstel-20261030/zin-22-volledig.mp3", "public/package-audio/zinsherstel-20261030/zin-22.mp3", "public/package-audio/zinsherstel-20261030/zin-33.mp3", "public/package-audio/zinsherstel-20261030/zin-35.mp3", "public/package-audio/zinsherstel-20261030/zin-36.mp3", "public/package-audio/zinsherstel-20261030/zin-39.mp3", "public/package-audio/zinsherstel-20261030/zin-50.mp3", "public/package-audio/zinsherstel-20261030/zin-51.mp3", "public/package-audio/zinsherstel-20261030/zin-52.mp3", "public/package-audio/zinsherstel-20261030/zin-59.mp3", "public/package-audio/zinsherstel-20261030/zin-60.mp3", "scripts/build-audio-register.mjs", "scripts/check-hidden-b2-release.mjs", "scripts/check-sentence-release.mjs", "scripts/check-sentence-revision.mjs", "scripts/check-word-images-batch-release.mjs", "scripts/test-connected-content.mjs", "scripts/test-content-audio-repair-20261030.mjs", "scripts/test-content-repair-20261030.mjs", "scripts/test-cumulative-integration.mjs", "scripts/test-dialogue-repair.mjs", "scripts/test-level-routes.mjs", "scripts/test-sections.mjs", "scripts/test-sentence-levels-20261030.mjs", "scripts/test-sentence-levels-browser-20261030.mjs", "scripts/test-sentence-release.mjs", "scripts/test-sentence-second-review-20261030.mjs", "scripts/test-sentence-second-review-browser-20261030.mjs"];
 assert.deepEqual(changed,allowed.sort(compare));
 assert.deepEqual(changed,[...r.changedFiles].sort(compare));
 for(const f of changed)assert.equal(sha(read(f)),r.files[f],f);
 for(const [f,h]of Object.entries(r.evidence))assert.equal(sha(read(f)),h,f);
 assert.deepEqual(lines(git('diff','--name-only','--diff-filter=MD',r.baselineSourceCommit,successor.baselineSourceCommit,'--','public')),['public/content-register/active.json']);
 assert.deepEqual(lines(git('diff','--name-only',r.baselineSourceCommit,successor.baselineSourceCommit,'--','app','components','hooks','db','drizzle','.github')),[]);
 const levels=JSON.parse(read('data/klink-sentence-levels.json')).items;
 assert.equal(levels.length,1292);assert.equal(levels.filter(x=>x.level==='A1').length,1225);assert.equal(levels.filter(x=>x.level==='A2').length,67);
 assert(levels.every(x=>x.status==='reviewed'));
 const clips=JSON.parse(read('docs/sentence-second-review-20261030/audio.json'));
 const audit=JSON.parse(read(dir+'audio-quality.json'));
 assert.equal(clips.length,14);assert.equal(audit.clips.length,14);assert.equal(audit.humanListeningReview,'open');
 for(const c of clips){
  assert.equal(sha(read('public'+c.src)),c.sha256);assert.equal(c.voiceId,'0qLmDzgqulxcvv0yf3kg');assert.equal(c.humanListeningReview,'open');
  const a=audit.clips.find(x=>x.id===c.id);assert.equal(a.sha256,c.sha256);assert(a.decoded&&a.metadataVerified);assert.equal(a.clippedSamples,0);assert(a.trailingBelowMinus45dBMs>=80);
 }
 const review=JSON.parse(read(dir+'review.json'));
 for(const k of ['types','targetedLint','build','unit','browser','audioMetadata','preservation','localOnly'])assert.equal(review[k],true,k);
 const backup=JSON.parse(read(dir+'backup.json'));assert.equal(backup.verified,true);assert(backup.driveId&&backup.sha256);
 for(const f of changed)assert.equal(backup.files[f],r.files[f],f);
 return {...r,successor};
}
export function readBeforeSentenceRelease(file,r,read=readFileSync){return r.changedFiles.includes(file)?git('show',r.baselineSourceCommit+':'+file):readBeforeSmallWordRounds(file,r.successor,read);}
