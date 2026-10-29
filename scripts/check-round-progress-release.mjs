import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const git=(...args)=>execFileSync('git',args,{maxBuffer:128*1024*1024});
const lines=b=>b.toString().trim().split('\n').filter(Boolean);
const sha=b=>createHash('sha256').update(b).digest('hex');
const allowed=[
 'app/learner-ui.css',
 'components/product/alfa-c-dagelijks.tsx','components/product/alfa-c-functioneel.tsx','components/product/alfa-c-practice.tsx',
 'components/product/package-group-practice.tsx','components/product/practice-chapters.tsx','components/product/round-progress.tsx',
 'lib/alfa-c-round-progress.ts','lib/round-progress.ts',
 'scripts/check-production-release.mjs','scripts/check-round-progress-release.mjs',
 'scripts/test-alfa-c-functioneel-browser.mjs','scripts/test-round-progress.mjs','scripts/test-round-progress-browser.mjs','scripts/test-round-progress-release.mjs',
];
export function verifyRoundProgressRelease(read=readFileSync){
 const release=JSON.parse(read('docs/klink-owner-release-round-progress-20261029.json'));
 assert.equal(release.approvedBy,'Nico');assert.equal(release.userRequest,'Ja, dat is goed. Dat mag je erin bouwen.');assert.equal(release.publicationApproved,true);
 assert.equal(release.liveSourceCommit,'c2dedeb2167b630a124d7ecb59f9e99953383969');
 assert.equal(release.baselineSourceCommit,'9a6eeda0dedeb2b04b58d2c799eda813fcdca0a8');
 git('merge-base','--is-ancestor',release.liveSourceCommit,release.baselineSourceCommit);git('merge-base','--is-ancestor',release.baselineSourceCommit,'HEAD');
 const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','vite.config.ts','package.json','package-lock.json','wrangler.jsonc'];
 const changed=[...new Set([...lines(git('diff','--name-only',release.baselineSourceCommit,'--',...roots)),...lines(git('ls-files','--others','--exclude-standard','--',...roots))])].sort((a,b)=>a<b?-1:a>b?1:0);
 assert.deepEqual(changed,[...release.changedFiles].sort((a,b)=>a<b?-1:a>b?1:0));assert(changed.every(f=>allowed.includes(f)),'Only approved progress code, styling and local checks');
 for(const file of changed)assert.equal(sha(read(file)),release.files[file],file);
 assert.equal(git('diff',release.baselineSourceCommit,'--','data','public','db','drizzle','hooks','lib/learner-progress.ts','lib/alfa-c-functioneel.ts','lib/alfa-c-dagelijks.ts','lib/alfa-c-practice.ts','lib/alfa-c-docent.ts').length,0,'Content, media and existing progress formats stay intact');
 const review=JSON.parse(read('docs/round-progress-20261029/review.json'));
 for(const key of ['types','lint','build','unit','browser','functional','menu','regression','storagePreserved','localOnly'])assert.equal(review[key],true,key);
 const browser=JSON.parse(read('docs/round-progress-20261029/browser.json'));assert.deepEqual(browser.errors,[]);assert(browser.checks.length>=8);
 const functional=JSON.parse(read('docs/round-progress-20261029/functional.json'));assert.equal(functional.steps.length,144);assert.deepEqual(functional.errors,[]);
 const backup=JSON.parse(read('docs/round-progress-20261029/backup.json'));assert.equal(backup.verified,true);assert(backup.driveId&&backup.sha256);
 for(const file of changed)assert.equal(backup.files[file],release.files[file],`Verified source backup: ${file}`);
 return release;
}
export function readBeforeRoundProgress(file,release,read=readFileSync){return release.changedFiles.includes(file)?git('show',`${release.baselineSourceCommit}:${file}`):read(file);}
