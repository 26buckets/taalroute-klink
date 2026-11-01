import {verifyEnterFocusRelease,readBeforeEnterFocus} from './check-enter-focus-release-20261101.mjs';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const base='5aff33c933f6e6446264f4ae668ea2a923c20e61',live='039eb22ede86403144dc150e7f0f995df10c4f81',folder='docs/repeat-rounds-20261101/';
const git=(...a)=>execFileSync('git',a,{maxBuffer:128e6}),sha=b=>createHash('sha256').update(b).digest('hex'),lines=b=>b.toString().trim().split('\n').filter(Boolean),sort=a=>a.sort((a,b)=>a.localeCompare(b));
const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','VORMGEVING-VASTGEZET.md','docs/appearance-floor-20261031','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','next.config.ts','package.json','package-lock.json','wrangler.jsonc'];
export function verifySourceRepeatRelease(read=readFileSync){
 const successor=verifyEnterFocusRelease(read),currentRead=read;read=file=>readBeforeEnterFocus(file,successor,currentRead);
 const json=f=>JSON.parse(read(f)),r=json('docs/klink-owner-release-source-repeat-20261101.json');
 assert.equal(r.baselineSourceCommit,base);assert.equal(r.liveSourceCommit,live);assert.equal(r.approvedBy,'Nico');assert.equal(r.ownerApproval,'standing-owner-approval');assert(r.publicationApproved&&r.appearanceUnchanged);
 assert(r.userRequest.includes('overige Klink-invulbatches zelfstandig af'));
 const policy='docs/klink-invullen-20261101/automatic-owner-approval.json';assert.equal(sha(read(policy)),sha(git('show',base+':'+policy)));
 git('merge-base','--is-ancestor',live,base);git('merge-base','--is-ancestor',base,'HEAD');assert.equal(git('diff','--name-only',live,base,'--',...roots).length,0);
 const changed=sort(lines(git('diff','--name-only',base,successor.baselineSourceCommit,'--',...roots)));assert.deepEqual(changed,r.changedFiles);assert.deepEqual(sort(Object.keys(r.files)),changed);
 for(const[f,h]of Object.entries(r.files))assert.equal(sha(read(f)),h,f);for(const[f,h]of Object.entries(r.evidenceFiles))assert.equal(sha(read(f)),h,f);
 assert.equal(git('diff','--name-only',base,successor.baselineSourceCommit,'--','app','hooks','public','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','VORMGEVING-VASTGEZET.md','docs/appearance-floor-20261031','package.json','package-lock.json','vite.config.ts','wrangler.jsonc').length,0,'Preserve approved appearance, every original media/content file, storage, dependencies and publication configuration');
 assert.deepEqual(changed.filter(f=>f.startsWith('components/')),['components/product/practice-chapters.tsx','components/product/production-round.tsx','components/product/source-repeat-round.tsx']);
 assert.deepEqual(changed.filter(f=>f.startsWith('data/')),['data/klink-source-repeat-rounds.json']);assert.deepEqual(changed.filter(f=>f.startsWith('lib/')),['lib/practice-chapters.ts','lib/source-repeat.ts']);
 const data=json('data/klink-source-repeat-rounds.json'),source=json(folder+'sources/position-references.json'),native=json(folder+'sources/native-document.json');assert.equal(data.rounds.length,48);assert.equal(data.sourceRevisionId,native.revisionId);assert.equal(source.revisionId,native.revisionId);
 const index=json('data/klink-production-index.json'),positionIds=[],sourceIds=[];
 for(const [i,round]of data.rounds.entries()){
  assert.equal(round.id,source.rounds[i].roundId);assert.equal(round.positions.length,12);assert(round.title);
  for(const [j,p]of round.positions.entries()){
   const expected=source.rounds[i].positions[j];assert.deepEqual(Object.keys(p).sort(),['bankId','id','sourceId']);assert.equal(p.id,expected.positionId);assert.equal(p.sourceId,expected.sourceExerciseId);
   const bank=index.find(b=>b.id===p.bankId);assert(bank);const file='public'+bank.url;assert(expected.currentSourceFiles.includes(file));const e=json(file).exercises.find(e=>e.exerciseId===p.sourceId);assert(e);assert.equal(e.independentReading,false);assert.equal(e.reviewEligible,false);positionIds.push(p.id);sourceIds.push(p.sourceId);
  }
 }
 assert.equal(new Set(positionIds).size,576);assert.equal(new Set(sourceIds).size,576);for(const f of source.sourceFiles)assert.equal(sha(read(f.path)),f.sha256);
 const player=read('components/product/source-repeat-round.tsx').toString();assert(player.includes('exerciseSet={exercises} onAttempt={undefined}'),'Repeat never changes original attempt/review records');
 const browser=json(folder+'local/browser-checks.json');assert.equal(browser.checks.length,1152);assert.equal(browser.roundChecks.length,96);assert.deepEqual(browser.errors,[]);assert(browser.roundChecks.every(c=>c.resumeAfterReload&&c.restartRetainsCompletion&&c.originalCompletionIsolated&&c.originalKeysPreserved>=800&&c.earlierRepeatCompletionPreserved));
 const layout=json(folder+'local/layout-checks.json');assert.equal(layout.checks.length,36);assert.deepEqual(layout.errors,[]);assert(layout.checks.every(c=>c.buttonsReachable&&c.noHorizontalOverflow&&c.goalDialogFits&&c.actualTheme===c.theme));
 const smoke=json(folder+'local/current-baseline-smoke/browser-checks.json');assert.equal(smoke.checks.length,24);assert.equal(smoke.roundChecks.length,2);assert.deepEqual(smoke.errors,[]);
 const loading=json(folder+'local/loading-checks.json');assert.equal(loading.checks.length,6);assert.deepEqual(loading.errors,[]);assert(loading.checks.every(c=>c.rejected&&c.retryRecovered&&c.oldReviewPreserved));
 const audio=json(folder+'audio-audit.json');assert(audio.passed);assert.equal(audio.files.length,417);
 const media=json(folder+'local/media-checks.json');assert.equal(media.hashes.length,417);assert(media.hashes.every(c=>c.sourceAndHostedIdentical&&c.taalrouteMetadataRetained));assert.equal(media.decoded.length,2);assert(media.decoded.every(c=>c.files.length===417));assert.equal(media.played.length,6);assert(media.played.every(c=>c.ended&&c.nativeElement&&c.playedThroughExistingControl));assert.deepEqual(media.errors,[]);assert.equal(media.humanListeningPerformed,false);
 const proof=json(folder+'verification.json');for(const k of['types','lint','unit','build','sourceReferences','allAnswers','browser','progressIsolated','appearancePreserved','media','learningGoalsPreserved','localOnly'])assert.equal(proof[k],true,k);assert.equal(proof.independentHumanReview,false);assert.equal(proof.classroomPilot,'open');
 const backup=json(folder+'backup.json');assert(backup.verified&&backup.fullReadback&&backup.zipIntegrity&&backup.driveId);assert.deepEqual(backup.files,r.files);assert.deepEqual(backup.evidenceFiles,r.evidenceFiles);return {...r,successor};
}
export function readBeforeSourceRepeat(file,r,read=readFileSync){return r.changedFiles.includes(file)?git('show',base+':'+file):readBeforeEnterFocus(file,r.successor,read);}
