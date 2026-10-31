import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const git=(...a)=>execFileSync('git',a,{maxBuffer:128e6}),sha=b=>createHash('sha256').update(b).digest('hex');
const lines=b=>b.toString().trim().split('\n').filter(Boolean).sort((a,b)=>a.localeCompare(b));
export function verifyWordPlaceholderRelease(read=readFileSync){
 const r=JSON.parse(read('docs/klink-owner-release-word-placeholder-20261031.json'));
 assert.equal(r.approvedBy,'Nico');assert.equal(r.appearanceChangeApproved,true);assert.equal(r.publicationApproved,true);
 assert.equal(r.baselineSourceCommit,'f21e3398e7768df1e8c8ece10c176a19915ed343');assert.equal(r.liveSourceCommit,'f302ecb5ef17517eb373f7fb692a80d6cc0938a7');
 git('merge-base','--is-ancestor',r.liveSourceCommit,r.baselineSourceCommit);git('merge-base','--is-ancestor',r.baselineSourceCommit,'HEAD');
 const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','next.config.ts','package.json','package-lock.json','wrangler.jsonc'];
 const changed=[...new Set([...lines(git('diff','--name-only',r.baselineSourceCommit,'--',...roots)),...lines(git('ls-files','--others','--exclude-standard','--',...roots))])].sort((a,b)=>a.localeCompare(b));
 const expected=['app/learner-layout.css','components/product/compact-image.tsx','components/product/learner-app.tsx','components/product/package-exercise-browser.tsx','components/product/package-experience.tsx','components/product/word-placeholder.tsx','scripts/check-start-compact-release-20261031.mjs','scripts/check-word-placeholder-release-20261031.mjs','scripts/test-word-placeholder-release-20261031.mjs','scripts/test-word-placeholder-browser-20261031.mjs'].sort((a,b)=>a.localeCompare(b));
 assert.deepEqual(changed,expected);assert.deepEqual(r.changedFiles,expected);for(const f of changed)assert.equal(sha(read(f)),r.files[f],f);
 assert.equal(git('diff','--name-only',r.baselineSourceCommit,'--','data','lib','hooks','public').length,0,'Original media, audio, content and storage remain byte-identical');
 const css=read('app/learner-layout.css').toString(),base=git('show',r.baselineSourceCommit+':app/learner-layout.css').toString();
 assert.equal(css.replace(/\n\/\* One lightweight word holder[\s\S]*?(?=\n\/\* Direct choosing)/,''),base,'Only the approved placeholder CSS block may change');
 assert.match(css,/opacity:\s*\.035/);assert.match(css,/background:\s*url\(['"]?\/taalroute-menu\/klink\.svg/);
 const approval=JSON.parse(read(r.approval));assert.equal(approval.userRequest,r.userRequest);assert.equal(approval.appearanceChangeApproved,true);
 for(const f of changed.filter(f=>/^(app|components)\//.test(f)))assert.equal(approval.files[f],r.files[f]);
 const floor=JSON.parse(read('docs/appearance-floor-20261031/floor.json'));assert(floor.approvedUpdates.includes(r.approval));assert.equal(floor.sourceCommit,'cc7fff4646d3ad9bdb33f13cc7e75eec1b356fa2');
 for(const[f,h]of Object.entries(r.evidence))assert.equal(sha(read(f)),h,f);
 const review=JSON.parse(read('docs/word-placeholder-20261031/review.json'));for(const k of ['wholeWords','faintLogo','imagesPreserved','savedWords','navigation','responsive','lightDark','unchangedScreens','types','lint','build','localOnly'])assert.equal(review[k],true,k);
 const backup=JSON.parse(read('docs/word-placeholder-20261031/backup.json'));assert(backup.verified&&backup.driveId&&backup.sha256);for(const f of changed)assert.equal(backup.files[f],r.files[f],f);
 return r;
}
export function readBeforeWordPlaceholder(file,r,read=readFileSync){return r.changedFiles.includes(file)||file==='docs/appearance-floor-20261031/floor.json'?git('show',r.baselineSourceCommit+':'+file):read(file);}
