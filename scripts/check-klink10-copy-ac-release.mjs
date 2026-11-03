import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const git=(...a)=>execFileSync('git',a,{maxBuffer:128e6}),sha=b=>createHash('sha256').update(b).digest('hex');
const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','VORMGEVING-VASTGEZET.md','docs/appearance-floor-20261031','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','next.config.ts','package.json','package-lock.json','wrangler.jsonc'];
const lines=b=>b.toString().trim().split('\n').filter(Boolean),sort=a=>a.sort((a,b)=>a.localeCompare(b));
export function verifyCopyACRelease(read=readFileSync){
 const json=p=>JSON.parse(read(p)),root='docs/klink10-copy-ac-20261103/',r=json('docs/klink-owner-release-ten-copy-ac-20261103.json'),m=json(root+'manifest.json'),old=p=>git('show',r.baselineSourceCommit+':'+p);
 assert.equal(r.approvedBy,'Nico');assert.equal(r.ownerApproval,'standing-owner-approval');assert(r.publicationApproved&&r.appearancePreserved&&r.progressPreserved);assert.equal(r.standingPolicySha256,sha(read('docs/klink-invullen-20261101/automatic-owner-approval.json')));
 assert.equal(r.baselineSourceCommit,m.baselineSourceCommit);assert.equal(r.liveSourceCommit,json(root+'baseline-live-release.json').sourceCommit);git('merge-base','--is-ancestor',r.liveSourceCommit,r.baselineSourceCommit);git('merge-base','--is-ancestor',r.baselineSourceCommit,'HEAD');
 const changed=sort([...new Set([...lines(git('diff','--name-only',r.baselineSourceCommit,'--',...roots)),...lines(git('ls-files','--others','--exclude-standard','--',...roots))])]);assert.deepEqual(changed,r.changedFiles);assert.deepEqual(sort(Object.keys(r.files)),changed);
 for(const[p,h]of Object.entries({...r.files,...r.evidenceFiles}))assert.equal(sha(read(p)),h,p);
 assert.equal(git('diff','--name-only','--diff-filter=MD',r.baselineSourceCommit,'--','public').length,0);assert.equal(git('diff','--name-only',r.baselineSourceCommit,'--','app','components','lib','hooks','.github','wrangler.jsonc','package.json','package-lock.json').length,0);
 const idx='data/klink-production-index.json';assert.deepEqual(json(idx),[...JSON.parse(old(idx)),m.row]);assert.equal(m.row.help,'practice');assert.equal(m.row.activity,'copy');assert.equal(m.row.level,'alfa-c');assert.equal(m.row.count,10);assert.equal(m.newQuestions,0);assert.equal(m.newAudio,0);assert.equal(m.newPublicFiles,1);
 const bank=json('public'+m.row.url),original=json('public'+m.oldRow.url);assert.equal(bank.id,m.row.id);assert.equal(sha(read('public'+m.row.url)),m.bankSha256);assert.equal(sha(read('public'+m.oldRow.url)),m.oldBankSha256);assert(read('public'+m.oldRow.url).equals(old('public'+m.oldRow.url)));
 assert.deepEqual(bank.exercises,original.exercises.slice(0,10).map(e=>({...e,access:'supported-practice'})));assert.deepEqual(bank.exercises.map(e=>e.exerciseId),m.sourceIds);assert.equal(new Set(m.sourceIds).size,10);
 for(const e of bank.exercises){assert.equal(e.answerPolicy,'exact-copy');assert.equal(e.componentId,'ALF-CMP-006');assert.equal(e.assessment,'answer');assert(!e.reviewEligible&&!e.independentReading);}
 assert.equal(sha(read(root+'selected-source.txt')),m.selectedSourceSha256);assert.equal(sha(read(root+'original-source.txt')),m.originalSourceSha256);
 const b=json(root+'local/browser.json');assert.equal(b.checks.length,40);assert.equal(b.crossRoute.length,4);assert.deepEqual(b.errors,[]);assert(b.checks.every(x=>x.exactModelAccepted&&x.uppercaseAndDoubleRejected&&x.firstAnswerPreserved));assert(b.crossRoute.every(x=>x.guidedDraftResumed&&x.sharedFirstAnswerPreserved));
 const sheet=json(root+'local/sheet-native.json');assert.equal(sheet.checks.length,20);assert.equal(sheet.native.length,2);assert(sheet.native.every(x=>x.playedToEnd));assert.deepEqual(sheet.errors,[]);
 const v=json(root+'verification.json');for(const k of ['sourceReviewed','exactCaseTested','types','regression','appearanceReviewed','existingPlayersUnchanged','sameCanonicalStorageIds'])assert(v[k],k);
 const backup=json(root+'backup.json');assert(backup.driveId&&backup.fullReadback&&backup.zipIntegrity);assert.deepEqual(backup.files,r.files);assert.deepEqual(backup.evidenceFiles,r.evidenceFiles);return r;
}
export function readBeforeCopyAC(file,r,read=readFileSync){return r.changedFiles.includes(file)?git('show',r.baselineSourceCommit+':'+file):read(file);}
