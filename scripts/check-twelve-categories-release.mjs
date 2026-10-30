import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const git=(...args)=>execFileSync('git',args,{maxBuffer:128*1024*1024});
const sha=b=>createHash('sha256').update(b).digest('hex');
const lines=b=>b.toString().trim().split('\n').filter(Boolean);
export function verifyTwelveCategoriesRelease(read=readFileSync){
 const r=JSON.parse(read('docs/klink-owner-release-twelve-categories-20261030.json'));
 assert.equal(r.approvedBy,'Nico');assert.equal(r.publicationApproved,true);
 assert(r.userRequest.includes('allemaal dezelfde structuur'));assert(r.userRequest.includes('Ga je gang'));
 assert.equal(r.liveSourceCommit,'5c43d45f04bbe5bfa5fbffaa158a3e776e6ffd43');
 assert.equal(r.baselineSourceCommit,'0a693a950ab03316c57e3b755e65d8aabbff0241');
 git('merge-base','--is-ancestor',r.liveSourceCommit,r.baselineSourceCommit);git('merge-base','--is-ancestor',r.baselineSourceCommit,'HEAD');
 const allowed=['docs/KLINK-DOCENTHANDLEIDING.md','AGENTS.md','components/product/alfa-c-docent.tsx','components/product/practice-chapters.tsx','data/klink-teacher-manual.json','lib/alfa-c-docent.ts','lib/alfa-c-navigation.ts','lib/practice-chapters.ts','public/klink-oefenoverzicht-20261030.html','scripts/build-practice-overview.mjs','scripts/check-word-image-beta-release.mjs','scripts/check-twelve-categories-release.mjs','scripts/test-twelve-categories-release.mjs','scripts/test-alfa-c-integration.mjs','scripts/test-alfa-c-menu-browser.mjs','scripts/test-practice-chapters-browser.mjs','scripts/test-unified-practice-navigation.mjs'];
 const roots=['docs/KLINK-DOCENTHANDLEIDING.md','app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','vite.config.ts','package.json','package-lock.json','wrangler.jsonc'];
 const changed=[...new Set([...lines(git('diff','--name-only',r.baselineSourceCommit,'--',...roots)),...lines(git('ls-files','--others','--exclude-standard','--',...roots))])].sort();
 assert.deepEqual(changed,[...allowed].sort());assert.deepEqual(changed,[...r.changedFiles].sort());
 for(const f of changed)assert.equal(sha(read(f)),r.files[f],f);
 assert.deepEqual(lines(git('diff','--name-only',r.baselineSourceCommit,'--','public')),['public/klink-oefenoverzicht-20261030.html']);
 assert.deepEqual(lines(git('diff','--name-only',r.baselineSourceCommit,'--','data')),['data/klink-teacher-manual.json']);
 const review=JSON.parse(read('docs/twelve-categories-20261030/review.json'));
 for(const k of ['types','lint','build','navigation','browser','integration','progressPreserved','contentPreserved','localOnly'])assert.equal(review[k],true,k);
 const backup=JSON.parse(read('docs/twelve-categories-20261030/backup.json'));assert.equal(backup.verified,true);assert(backup.driveId&&backup.sha256);
 for(const f of changed)assert.equal(backup.files[f],r.files[f],f);
 return r;
}
export function readBeforeTwelveCategories(file,r,read=readFileSync){return r.changedFiles.includes(file)?git('show',`${r.baselineSourceCommit}:${file}`):read(file);}
