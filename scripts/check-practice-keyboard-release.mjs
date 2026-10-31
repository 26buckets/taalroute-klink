import {verifyWordMeaningsRelease,readBeforeWordMeanings} from './check-word-meanings-release-20261031.mjs';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const git=(...args)=>execFileSync('git',args,{maxBuffer:128e6});
const lines=b=>b.toString().trim().split('\n').filter(Boolean).sort((a,b)=>a.localeCompare(b));
const sha=b=>createHash('sha256').update(b).digest('hex');
export function verifyPracticeKeyboardRelease(read=readFileSync){
 const successor=verifyWordMeaningsRelease(read),currentRead=read;read=file=>readBeforeWordMeanings(file,successor,currentRead);
 const r=JSON.parse(read('docs/klink-owner-release-keyboard-20261031.json'));
 assert.equal(r.approvedBy,'Nico');assert.equal(r.publicationApproved,true);
 assert.equal(r.userRequest,'Voer je advies voor Enter en de pijltjestoetsen maar uit. Behoud alle audio en voortgang, test de bediening en zet de werkende versie online. Wat is de spatiebalk dan? Die wil ik ook gebruiken.');
 assert.equal(r.baselineSourceCommit,'54e9d39b57f9190523e6903f1e0fad24eda484b3');
 git('merge-base','--is-ancestor',r.baselineSourceCommit,'HEAD');
 const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','package.json','package-lock.json','wrangler.jsonc'];
 const changed=lines(git('diff','--name-only',r.baselineSourceCommit,successor.baselineSourceCommit,'--',...roots));
 const expected=['components/product/package-exercise-browser.tsx','components/product/package-group-practice.tsx','components/product/standard-practice-surface.tsx','components/product/extended-practice-surface.tsx','components/product/imported-practice-surface.tsx','hooks/use-practice-keyboard.ts','docs/KLINK-DOCENTHANDLEIDING.md','scripts/test-practice-keyboard-browser.mjs','scripts/test-practice-sheet-browser.mjs','scripts/check-practice-keyboard-release.mjs','scripts/check-imported-alfa-c-release-20261031.mjs'].sort((a,b)=>a.localeCompare(b));
 assert.deepEqual(changed,expected);assert.deepEqual([...r.changedFiles].sort((a,b)=>a.localeCompare(b)),expected);
 for(const file of changed)assert.equal(sha(read(file)),r.files[file],file);
 assert.deepEqual(lines(git('diff','--name-only',r.baselineSourceCommit,successor.baselineSourceCommit,'--','data','lib','public')),[]);
 const review=JSON.parse(read('docs/keyboard-20261031/review.json'));
 for(const key of ['keyboard','audio','progress','navigation','mobile','types','lint','build','localOnly'])assert.equal(review[key],true,key);
 const backup=JSON.parse(read('docs/keyboard-20261031/backup.json'));assert.equal(backup.verified,true);assert(backup.driveId&&backup.sha256);
 for(const file of changed)assert.equal(backup.files[file],r.files[file],file);
 return {...r,successor};
}
export function readBeforePracticeKeyboard(file,release,read=readFileSync){return release.changedFiles.includes(file)?git('show',`${release.baselineSourceCommit}:${file}`):readBeforeWordMeanings(file,release.successor,read);}
