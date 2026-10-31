import { verifyReviewEmptyRelease, readBeforeReviewEmpty } from './check-review-empty-release-20261031.mjs';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const git=(...args)=>execFileSync('git',args,{maxBuffer:128e6});
const sha=b=>createHash('sha256').update(b).digest('hex');
const sort=(a,b)=>a.localeCompare(b);
const lines=b=>b.toString().trim().split('\n').filter(Boolean).sort(sort);
export function verifyImageSizeRelease(read=readFileSync){
 const successor=verifyReviewEmptyRelease(read),currentRead=read;read=file=>readBeforeReviewEmpty(file,successor,currentRead);
 const r=JSON.parse(read('docs/klink-owner-release-image-size-20261031.json'));
 assert.equal(r.approvedBy,'Nico');assert(r.publicationApproved);assert.equal(r.generateImages,false);
 assert.equal(r.baselineSourceCommit,'b368996ce81590ddfa0afee1d5d488e415c9f58c');
 git('merge-base','--is-ancestor',r.liveSourceCommit,r.baselineSourceCommit);git('merge-base','--is-ancestor',r.baselineSourceCommit,'HEAD');
 const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','next.config.ts','package.json','package-lock.json','wrangler.jsonc'];
 const changed=lines(git('diff','--name-only',r.baselineSourceCommit,successor.baselineSourceCommit,'--',...roots));
 assert.deepEqual(changed,[...r.changedFiles].sort(sort));
 const allowed=['app/page.tsx','lib/compact-images.ts','lib/classroom-visibility.ts','lib/teacher-classroom.ts','data/klink-compact-images-20261031.json','scripts/check-drive-extra-release-20261031.mjs','scripts/check-image-size-release-20261031.mjs','scripts/test-image-size-release-20261031.mjs','scripts/test-compact-images-20261031.mjs','scripts/test-image-loading-browser-20261031.mjs','scripts/test-teacher-direct-board-browser.mjs'];
 const imageTests=['scripts/test-remaining-images-browser-20261030.mjs','scripts/test-archive-images-browser-20261030.mjs','scripts/test-word-images-batch-browser-20261030.mjs','scripts/test-drive-images-browser-20261031.mjs','scripts/test-dialogue-image-fit-browser.mjs'];
 assert(changed.every(f=>allowed.includes(f)||imageTests.includes(f)||f==='scripts/test-landing-browser.mjs'||f==='public/_headers'||/^components\/product\/[a-z-]+\.tsx$/.test(f)||/^public\/compact-images-20261031\/[a-f0-9]{20}\.(webp|svg)$/.test(f)));
 assert.equal(read('public/_headers').toString().trim(),'/compact-images-20261031/*\n  Cache-Control: public, max-age=31536000, immutable');
 for(const[f,h]of Object.entries(r.files))assert.equal(sha(read(f)),h,f);for(const f of changed)assert(r.files[f],f);
 assert.equal(git('diff','--name-only','--diff-filter=MD',r.baselineSourceCommit,'--','public','data').length,0,'Original media, content, answers and progress maps remain unchanged');
 const inventory=JSON.parse(read('docs/image-size-audit-20261031/inventory.json')),assets=JSON.parse(read('docs/image-size-audit-20261031/assets.json')),mapping=JSON.parse(read('data/klink-compact-images-20261031.json'));
 assert.equal(assets.length,506);assert.equal(Object.keys(mapping).length,assets.length);
 for(const a of assets){assert.equal(mapping[a.src],a.url);assert.equal(sha(read('public'+a.src)),a.sourceSha256);assert.equal(sha(read('public'+a.url)),a.sha256);assert(a.bytes<a.before*.9);}
 for(const a of inventory){const src=a.path.slice(6);assert(read('public'+(mapping[src]||src)).length<=98304,src+' is too large');}
 const checks=JSON.parse(read('docs/image-size-audit-20261031/checks.json'));assert.equal(checks.images,inventory.length);assert.equal(checks.classroomFailClosed,true);assert.equal(checks.originalsUnchanged,true);
 const review=JSON.parse(read('docs/image-size-audit-20261031/review.json'));for(const k of ['imageBudget','visualReadability','contentPreserved','lazyLanding','teacherGuard','navigation','progress','browser','types','lint','build','localOnly'])assert.equal(review[k],true,k);
 const backup=JSON.parse(read('docs/image-size-audit-20261031/backup.json'));assert(backup.verified&&backup.driveId&&backup.sha256);for(const f of changed)assert.equal(backup.files[f],r.files[f],f);
 return {...r,successor};
}
export function readBeforeImageSize(file,r,read=readFileSync){return r.changedFiles.includes(file)||r.historicalFiles.includes(file)?git('show',r.baselineSourceCommit+':'+file):readBeforeReviewEmpty(file,r.successor,read);}
