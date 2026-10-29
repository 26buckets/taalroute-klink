import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const git=(...args)=>execFileSync('git',args,{maxBuffer:128*1024*1024});
const lines=b=>b.toString().trim().split('\n').filter(Boolean);
const sha=b=>createHash('sha256').update(b).digest('hex');
const allowed=['app/learner-ui.css','components/product/alfa-c-docent.tsx','components/product/package-exercise-browser.tsx','components/product/practice-chapters.tsx','scripts/check-layout-fixes-release.mjs','scripts/check-round-progress-release.mjs','scripts/test-layout-fixes-release.mjs','scripts/test-model-sentence-layout.mjs','scripts/test-teacher-card-layout.mjs','scripts/test-alfa-c-integration.mjs'];
export function verifyLayoutFixesRelease(read=readFileSync){
 const r=JSON.parse(read('docs/klink-owner-release-layout-fixes-20261029.json'));
 assert.equal(r.approvedBy,'Nico');assert.equal(r.publicationApproved,true);
 assert.equal(r.userRequest,'We zorg dat alles online komt te staan van die ik neem een mandje bij de ingang, maar dat is voor alle opdrachten. Voor allemaal fout, alsjeblieft. Fix dat, overal.');
 assert.equal(r.baselineSourceCommit,'84fc898006a9b668a2630838ac9e8c407c063620');assert.equal(r.liveSourceCommit,'4970049f7831d020f52218e39c192368bb371f23');
 git('merge-base','--is-ancestor',r.liveSourceCommit,r.baselineSourceCommit);git('merge-base','--is-ancestor',r.baselineSourceCommit,'HEAD');
 const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','vite.config.ts','package.json','package-lock.json','wrangler.jsonc'];
 const changed=[...new Set([...lines(git('diff','--name-only',r.baselineSourceCommit,'--',...roots)),...lines(git('ls-files','--others','--exclude-standard','--',...roots))])].sort((a,b)=>a.localeCompare(b));
 assert.deepEqual(changed,[...r.changedFiles].sort((a,b)=>a.localeCompare(b)));assert(changed.every(f=>allowed.includes(f)),'Only display fixes and their local checks');
 for(const file of changed)assert.equal(sha(read(file)),r.files[file],file);
 assert.equal(git('diff',r.baselineSourceCommit,'--','data','public','lib','hooks','db','drizzle').length,0,'Keep all content, media, audio and progress models intact');
 const review=JSON.parse(read('docs/layout-fixes-20261029/review.json'));
 for(const k of ['types','lint','build','sentences','teacherCards','menu','integration','unit','localOnly'])assert.equal(review[k],true,k);
 const sentences=JSON.parse(read('docs/layout-fixes-20261029/sentences.json'));assert(sentences.checks.length>=80);assert(sentences.checks.every(c=>c.fits&&c.linesFit&&c.noInnerScroll&&c.noPageOverflow));
 const cards=JSON.parse(read('docs/layout-fixes-20261029/cards.json'));assert.equal(cards.checks.length,8);assert(cards.checks.every(c=>c.cards===5&&c.heading&&c.separateLabels&&c.linksAndHistory));
 const backup=JSON.parse(read('docs/layout-fixes-20261029/backup.json'));assert.equal(backup.verified,true);assert(backup.driveId&&backup.sha256);
 for(const file of changed)assert.equal(backup.files[file],r.files[file],file);
 return r;
}
export function readBeforeLayoutFixes(file,r,read=readFileSync){return r.changedFiles.includes(file)?git('show',`${r.baselineSourceCommit}:${file}`):read(file);}
