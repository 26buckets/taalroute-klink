import{verifyKeyboardConsistencyRelease,readBeforeKeyboardConsistency}from'./check-keyboard-consistency-release-20261031.mjs';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const git=(...args)=>execFileSync('git',args,{maxBuffer:128e6});
const lines=b=>b.toString().trim().split('\n').filter(Boolean).sort((a,b)=>a.localeCompare(b));
const sha=b=>createHash('sha256').update(b).digest('hex');
export function verifyWordMeaningsRelease(read=readFileSync){
 const successor=verifyKeyboardConsistencyRelease(read),currentRead=read;read=file=>readBeforeKeyboardConsistency(file,successor,currentRead);
 const r=JSON.parse(read('docs/klink-owner-release-word-meanings-20261031.json'));
 assert.equal(r.approvedBy,'Nico');assert.equal(r.publicationApproved,true);
 assert.equal(r.userRequest,'Ja, volg je advies bij die vier groepen twijfelgevallen. Pas de gekoppelde oefeningen en antwoorden aan, controleer de audio en zet de herstelversie daarna live. Geef mij weer een directe link naar het resultaat.');
 assert.equal(r.audioAuthorization,'Maak de noodzakelijke opnamen');
 assert.equal(r.baselineSourceCommit,'7606464fe84907200c52f332e4380b3fad5456f5');
 git('merge-base','--is-ancestor',r.liveSourceCommit,r.baselineSourceCommit);git('merge-base','--is-ancestor',r.baselineSourceCommit,'HEAD');
 const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','package.json','package-lock.json','wrangler.jsonc'];
 const changed=lines(git('diff','--name-only',r.baselineSourceCommit,successor.baselineSourceCommit,'--',...roots));
 assert.deepEqual(changed,[...r.changedFiles].sort((a,b)=>a.localeCompare(b)));
 for(const f of changed)assert.equal(sha(read(f)),r.files[f],f);
 assert.deepEqual(lines(git('diff','--name-only','--diff-filter=MD',r.baselineSourceCommit,successor.baselineSourceCommit,'--','public')),['public/content-register/active.json','public/content-register/summary.json']);
 for(const[f,h]of Object.entries(r.evidence))assert.equal(sha(read(f)),h,f);
 const check=JSON.parse(read('docs/word-meanings-release-20261031/verification.json'));
 for(const k of ['types','scopedLint','build','unit','browser','nativePlayback','audioMetadata','preservation','localOnly'])assert.equal(check[k],true,k);
 const clips=JSON.parse(read('docs/word-meanings-release-20261031/audio.json'));assert.equal(clips.length,4);
 for(const c of clips){assert.equal(sha(read('public'+c.src)),c.sha256);assert.equal(c.voiceId,'0qLmDzgqulxcvv0yf3kg');assert(c.metadataVerified&&c.audioPacketsUnchanged);assert.equal(c.humanListeningReview,'open');}
 const backup=JSON.parse(read('docs/word-meanings-release-20261031/backup.json'));assert.equal(backup.verified,true);assert(backup.driveId&&backup.sha256);
 for(const f of changed)assert.equal(backup.files[f],r.files[f],f);
 return {...r,successor};
}
export function readBeforeWordMeanings(file,r,read=readFileSync){return r.changedFiles.includes(file)?git('show',`${r.baselineSourceCommit}:${file}`):readBeforeKeyboardConsistency(file,r.successor,read);}
