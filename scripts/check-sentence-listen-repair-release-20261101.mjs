import {verifyCompleteRelease,readBeforeCompleteRelease} from './check-klink-complete-release-20261101.mjs';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const base='9ee385d1199d4359b8e9059da3a06d57ac7d7ebf',folder='docs/sentence-listen-repair-20261101/';
const git=(...a)=>execFileSync('git',a,{maxBuffer:128e6}),sha=b=>createHash('sha256').update(b).digest('hex');
const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','next.config.ts','package.json','package-lock.json','wrangler.jsonc'];
const allowed=['app/learner-layout.css','components/product/package-exercise-browser.tsx','scripts/check-synonym-recovery-release-20261101.mjs','scripts/check-sentence-listen-repair-release-20261101.mjs','scripts/test-sentence-listen-repair-release-20261101.mjs','scripts/test-sentence-listen-repair-browser-20261101.mjs'].sort((a,b)=>a.localeCompare(b));
const lines=b=>b.toString().trim().split('\n').filter(Boolean);
export function verifySentenceListenRepairRelease(read=readFileSync){
 const successor=verifyCompleteRelease(read),currentRead=read;read=file=>readBeforeCompleteRelease(file,successor,currentRead);
 const r=JSON.parse(read('docs/klink-owner-release-sentence-listen-repair-20261101.json'));
 assert.equal(r.approvedBy,'Nico');assert.equal(r.publicationApproved,true);assert.equal(r.appearanceChangeApproved,true);
 assert.equal(r.baselineSourceCommit,base);assert.equal(r.liveSourceCommit,'12715486542e6aa766862a8068cd4ce65294ed28');assert(r.userRequest.includes('Zorg dat die even groot zijn'));
 git('merge-base','--is-ancestor',r.liveSourceCommit,base);git('merge-base','--is-ancestor',base,'HEAD');
 const changed=lines(git('diff','--name-only',base,successor.baselineSourceCommit,'--',...roots)).sort((a,b)=>a.localeCompare(b));
 assert.deepEqual(changed,allowed);assert.deepEqual(r.changedFiles,allowed);assert.deepEqual(Object.keys(r.files).sort((a,b)=>a.localeCompare(b)),allowed);for(const file of allowed)assert.equal(sha(read(file)),r.files[file],file);
 assert.equal(git('diff','--name-only',base,successor.baselineSourceCommit,'--','data','lib','public','hooks','db','drizzle','.github','package.json','package-lock.json','wrangler.jsonc').length,0,'All content, recordings, identifiers and storage stay unchanged');
 const floor=JSON.parse(read('docs/appearance-floor-20261031/floor.json')),old=JSON.parse(git('show',base+':docs/appearance-floor-20261031/floor.json'));
 assert.deepEqual({...floor,approvedUpdates:old.approvedUpdates},old);assert.deepEqual(floor.approvedUpdates,[...old.approvedUpdates,r.approval]);
 const approval=JSON.parse(read(r.approval));assert.equal(approval.userRequest,r.userRequest);assert.deepEqual(approval.files,r.files);
 const native=JSON.parse(read(folder+'browser-checks.json'));assert.equal(native.checks.length,26);assert.deepEqual(native.errors,[]);
 const panel=JSON.parse(read(folder+'view-checks.json'));assert.equal(panel.checks.length,216);assert.deepEqual(panel.errors,[]);
 const keys=JSON.parse(read(folder+'keyboard-checks.json'));assert.equal(keys.forms,58);assert.equal(keys.checks.length,466);assert.deepEqual(keys.errors,[]);
 const review=JSON.parse(read(folder+'review.json'));for(const key of['contentPreserved','audioBytesPreserved','progressPreserved','nativePlayback','blockedAutoplay','realFailureRetry','mobileTouch','keyboard','lightDark','latestSynonymsPreserved','types','lint','curriculum','localOnly'])assert.equal(review[key],true,key);
 const backup=JSON.parse(read(folder+'backup.json'));assert(backup.verified&&backup.fullReadback&&backup.zipIntegrity&&backup.driveId&&backup.sha256);assert.deepEqual(backup.files,r.files);
 return {...r,successor};
}
export function readBeforeSentenceListenRepair(file,r,read=readFileSync){return r.changedFiles.includes(file)||file==='docs/appearance-floor-20261031/floor.json'?git('show',base+':'+file):readBeforeCompleteRelease(file,r.successor,read);}
