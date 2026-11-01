import {verifyCardTitlesRelease,readBeforeCardTitles} from './check-card-titles-release-20261101.mjs';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

const folder='docs/writing-banks-20261101/';
const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','VORMGEVING-VASTGEZET.md','docs/appearance-floor-20261031','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','next.config.ts','package.json','package-lock.json','wrangler.jsonc'];
const git=(...args)=>execFileSync('git',args,{maxBuffer:128e6});
const sha=b=>createHash('sha256').update(b).digest('hex');
const lines=b=>b.toString().trim().split('\n').filter(Boolean);
export function verifyWritingBanksRelease(read=readFileSync){
 const successor=verifyCardTitlesRelease(read),currentRead=read;read=file=>readBeforeCardTitles(file,successor,currentRead);
 const json=f=>JSON.parse(read(f)),r=json('docs/klink-owner-release-writing-banks-20261101.json');
 assert.equal(r.approvedBy,'Nico');assert(r.publicationApproved&&r.appearanceUnchanged);assert.equal(r.ownerApproval,'standing-owner-approval');
 assert.equal(r.baselineSourceCommit,'17f9db234295127531719cebb3df45d666d8ccac');assert(r.liveSourceCommit);git('merge-base','--is-ancestor',r.liveSourceCommit,r.baselineSourceCommit);
 assert(r.userRequest.includes('Zet gecontroleerde batches online'));
 git('merge-base','--is-ancestor',r.baselineSourceCommit,'HEAD');
 const changed=[...new Set(lines(git('diff','--name-only',r.baselineSourceCommit,successor.baselineSourceCommit,'--',...roots)))].sort((a,b)=>a.localeCompare(b));
 assert.deepEqual(changed,r.changedFiles);assert.deepEqual(Object.keys(r.files).sort((a,b)=>a.localeCompare(b)),changed);
 for(const[f,h]of Object.entries({...r.files,...r.evidenceFiles}))assert.equal(sha(read(f)),h,f);
 assert.equal(git('diff','--name-only',r.baselineSourceCommit,successor.baselineSourceCommit,'--','app','hooks','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','VORMGEVING-VASTGEZET.md','docs/appearance-floor-20261031','package.json','package-lock.json','vite.config.ts').length,0,'Preserve every existing interface, player, dependency and workflow');
 assert.deepEqual(lines(git('diff','--name-only','--diff-filter=MD',r.baselineSourceCommit,successor.baselineSourceCommit,'--','public')),[],'Existing offered files remain intact');
 const player='components/product/package-group-practice.tsx';assert.deepEqual(changed.filter(f=>f.startsWith('components/')),[player]);
 const expectedPlayer=git('show',r.baselineSourceCommit+':'+player).toString().replace('const storageKey = groupSessionKey(sessionId ?? pack.id, activity);','const storageKey = groupSessionKey(sessionId ?? pack.id, activity, progressId);\n  const legacyStorageKey = groupSessionKey(legacySessionId ?? sessionId ?? pack.id, activity);').replace('restoreGroupSession(localStorage.getItem(storageKey) ?? (legacySessionId ? localStorage.getItem(groupSessionKey(legacySessionId, activity)) : null), exercises)','restoreGroupSession(localStorage.getItem(storageKey) ?? (legacySessionId ? localStorage.getItem(legacyStorageKey) : null), exercises, progressId, storageKey === legacyStorageKey ? null : localStorage.getItem(legacyStorageKey))').replace('if (legacySessionId) localStorage.setItem(storageKey, JSON.stringify({ version: 1, done: false }))','if (legacySessionId || storageKey !== legacyStorageKey) localStorage.setItem(storageKey, JSON.stringify({ version: 1, done: false }))');assert.equal(read(player).toString(),expectedPlayer,'Only session storage changes; every rendered element remains identical');
 const register=json(folder+'source-register.json');assert.equal(register.documents.length,44);assert.equal(register.summary.sourceRecords,880);
 const source=read(folder+'source-records.jsonl').toString().trim().split('\n').map(JSON.parse);assert.equal(source.length,880);assert.equal(new Set(source.map(x=>x.id)).size,880);
 const manifest=json(folder+'batch-01.json'),index=json('data/klink-production-index.json'),old=JSON.parse(git('show',r.baselineSourceCommit+':data/klink-production-index.json'));
 assert.equal(index.length,old.length+1);const revisedId='production:copy:alfa-c:KSW-AC-TN-081-100';
 for(const before of old){const after=index.find(x=>x.id===before.id);assert(after,before.id);assert.deepEqual({...after,url:before.url},before);if(before.id!==revisedId)assert.equal(after.url,before.url);}
 assert.equal(manifest.newUniqueSourceIds.length,4);assert.equal(new Set(manifest.newUniqueSourceIds).size,manifest.newUniqueSourceIds.length);
 for(const row of manifest.rows){
  assert.deepEqual(index.find(x=>x.id===row.id),row);const bytes=read('public'+row.url),bank=JSON.parse(bytes);assert(row.url.includes(sha(bytes).slice(0,16)));assert.equal(bank.id,row.id);assert.equal(bank.exercises.length,row.count);assert.equal(new Set(bank.exercises.map(e=>e.exerciseId)).size,row.count);
  for(const e of bank.exercises.filter(e=>manifest.newUniqueSourceIds.includes(e.exerciseId))){const s=source.find(x=>x.id===e.exerciseId);assert(s,e.exerciseId);assert.equal(e.exampleWord,s.sourceRecord.target??s.sourceRecord.sourceText);assert.deepEqual(e.fields,[{id:'copy',acceptedAnswers:[e.exampleWord]}]);assert.equal(e.answerPolicy,'exact-copy');assert.equal(e.componentId,'ALF-CMP-006');assert(!e.requiresAudio&&!e.instructionAudio&&!e.prompt&&!e.independentReading&&!e.reviewEligible);assert.equal(e.sourceRevisionId,s.revisionId);}
 }
 const alias='data/klink-progress-image-aliases-20261030.json';assert.equal(sha(read(alias)),sha(git('show',r.baselineSourceCommit+':'+alias)));
 assert.deepEqual(changed.filter(f=>f.startsWith('lib/')),['lib/group-practice.ts','lib/round-progress.ts']);
 const predecessor=json('data/klink-writing-progress-predecessors-20261101.json');assert.deepEqual(predecessor,manifest.progressPredecessors);assert.equal(Object.values(predecessor)[0].id,'collection:copy:'+revisedId+':'+manifest.preservedLegacyUrl);
 const oldBank=JSON.parse(git('show',r.baselineSourceCommit+':public'+old.find(x=>x.id===revisedId).url)),revised=json('public'+index.find(x=>x.id===revisedId).url);
 assert.deepEqual(revised.exercises.filter(e=>e.exerciseId!=='KSW-AC-TN-097'),oldBank.exercises.filter(e=>e.exerciseId!=='KSW-AC-TN-020'));
 assert.deepEqual(Object.values(predecessor)[0].exerciseIds,revised.exercises.map(e=>e.exerciseId));
 const overlap=json(folder+'overlap-review.json');assert.equal(overlap.reusedExisting.length,17);assert.equal(overlap.newUniqueTasks,3);
 assert(overlap.reusedExisting.every(x=>!manifest.newUniqueSourceIds.includes(x.sourceId)&&x.existingId&&x.criterionOpen));
 const review=json(folder+'content-review.json');assert.equal(review.rows.length,4);assert(review.rows.every(x=>x.review==='passed'));assert.equal(review.humanReviewPerformed,false);
 const browser=json(folder+'local/browser.json');assert.equal(browser.checks.length,32);assert.equal(browser.preservation.length,8);assert.deepEqual(browser.errors,[]);assert(browser.checks.every(x=>x.wrongRejected&&x.correctAccepted&&x.progressPreserved&&x.oldSessionPreserved));assert(browser.preservation.every(x=>x.geometryEqual&&x.oldProgressRetained));
 const smoke=json(folder+'local/current-baseline-smoke/browser.json');assert.equal(smoke.sourceCommit,r.baselineSourceCommit);assert.equal(smoke.checks.length,8);assert.equal(smoke.preservation.length,2);assert.deepEqual(smoke.errors,[]);
 assert.equal(browser.sessionRecovery.length,8);assert(browser.sessionRecovery.every(x=>x.oldSessionPreserved&&x.oldCompletionResumedAtCorrection&&x.restartStartsAtFirst));
 const checks=json(folder+'verification.json');for(const k of['types','lint','unit','build','sourceAndAnswers','browser','appearancePreserved','progressPreserved','localOnly'])assert.equal(checks[k],true,k);
 const backup=json(folder+'backup.json');assert(backup.verified&&backup.fullReadback&&backup.zipIntegrity&&backup.driveId);assert.deepEqual(backup.files,r.files);assert.deepEqual(backup.evidenceFiles,r.evidenceFiles);
 return {...r,successor};
}
export function readBeforeWritingBanks(file,r,read=readFileSync){return r.changedFiles.includes(file)?git('show',r.baselineSourceCommit+':'+file):readBeforeCardTitles(file,r.successor,read);}
